from modal import App, Cron
import os
import requests
from datetime import datetime
from src.database import SupabaseClient

# Re-use the app definition or create a new one if separating services
# Here we assume it's part of the main app, but we define the logic in a class or function
# to be imported by modal_app.py

class FollowUpScheduler:
    def __init__(self, admin_db: SupabaseClient):
        self.admin_db = admin_db

    def normalize_to_minutes(self, rule: dict) -> int:
        value = int(rule.get('value', 0))
        unit = rule.get('unit', 'minutes').lower()
        if unit in ['horas', 'hours', 'hour']:
            return value * 60
        if unit in ['dias', 'days', 'day']:
            return value * 1440
        return value

    async def run_check(self):
        print(f"[FollowUp] Starting check at {datetime.now()}")
        
        # 1. Get all agents with followup enabled
        try:
            res = self.admin_db.client.table("agent_configs")\
                .select("*")\
                .eq("followup_enabled", True)\
                .execute()
            agents = res.data
        except Exception as e:
            print(f"[FollowUp] Error fetching agents: {e}")
            return

        for agent in agents:
            await self._process_agent(agent)

    async def _process_agent(self, agent: dict):
        client_id = agent.get('client_id')
        webhook = agent.get('followup_webhook')
        rules_json = agent.get('followup_rules', [])
        
        if not webhook or not rules_json:
            print(f"[FollowUp] Skipping {client_id}: Missing webhook or rules")
            return

        # Setup Client DB
        s_url = agent.get('supabase_url')
        s_key = agent.get('supabase_service_role_key')
        
        try:
            if s_url and s_key:
                client_db = SupabaseClient(s_url, s_key)
            else:
                client_db = self.admin_db # Fallback (should typically be isolated)
            
            # Normalize rules
            # rules example: [{"value": 15, "unit": "minutes"}]
            # We want to check them in order.
            # But the SQL query handles the logic of "finding candidates"
            
            # For efficiency, we fetch LEADS that are 'active'
            # We can't do complex time math in Supabase easily without a stored proc, 
            # so we fetch leads with recent-ish activity or all active leads (careful with scale)
            # Better approach: Fetch active leads, check last message time in code (if < 1000 leads)
            # OR simple SQL filter if possible.
            
            # Fetch active leads
            leads_res = client_db.client.table("leads").select("*").eq("status", "active").execute()
            leads = leads_res.data
            
            for lead in leads:
                await self._check_lead(client_id, client_db, lead, rules_json, webhook)
                
        except Exception as e:
            print(f"[FollowUp] Error processing agent {client_id}: {e}")

    async def _check_lead(self, client_id, db, lead, rules, webhook):
        # Get last message
        try:
            # We need the VERY last message to see if it's from assistant and how long ago
            history = await db.get_conversation_history(client_id, lead['id'], limit=1)
            if not history:
                return
            
            last_msg = history[0] # get_conversation_history returns reverse order? No, usually ordered by desc in query but reversed in python
            # Wait, get_conversation_history in database.py does: .order("created_at", desc=True) then [::-1]
            # So the LAST element in the list is the most recent.
            if not history: return
            last_msg = history[-1]
            
            # Rule: Last message must be from ASSISTANT (Lead is silent)
            if last_msg['role'] != 'assistant':
                return

            # Calculate silence duration
            last_time = datetime.fromisoformat(last_msg['created_at'].replace('Z', '+00:00'))
            now = datetime.now(last_time.tzinfo)
            delta_minutes = int((now - last_time).total_seconds() / 60)
            
            last_triggered = lead.get('last_followup_minutes', 0) or 0
            
            # Check rules
            # We trigger the LARGEST rule that is satisfied and hasn't been triggered yet
            # Actually, per requirement: "15min, then 2h, then 24h".
            # So if delta=20min, trigger 15.
            # If delta=130min (2h10), and last=15, trigger 120.
            
            # Sort rules by minutes ascending
            sorted_rules = sorted(
                [{**r, 'min': self.normalize_to_minutes(r)} for r in rules], 
                key=lambda x: x['min']
            )
            
            target_rule = None
            
            for rule in sorted_rules:
                r_min = rule['min']
                if delta_minutes >= r_min and last_triggered < r_min:
                    target_rule = rule
                    # We continue loop? No, usually we trigger the next immediate one.
                    # If we jumped from 0 to 24h instantly (unlikely if cron runs every 5 min), 
                    # we might want to trigger the 24h one? Or the skipped ones?
                    # "Follow-up logic": usually trigger the relevant stage.
                    # Let's pick the highest valid rule to update state.
                    # But if user wants sequential messages (msg1, msg2), jumping might skip msg1.
                    # Given cron runs every 5 min, we usually hit them in order.
                    # Let's take the first one that qualifies (smallest > last_triggered) 
                    # to ensure sequence if they represent steps.
                    break 
            
            if target_rule:
                print(f"[FollowUp] Triggering {target_rule['min']}min notification for {lead['phone']}")
                
                # Payload
                payload = {
                    "event": "inactivity_trigger",
                    "client_id": client_id,
                    "phone": lead['phone'],
                    "lead_name": lead.get('name'),
                    "minutes_inactive": target_rule['min'],
                    "rule_unit": target_rule.get('unit'),
                    "rule_value": target_rule.get('value')
                }
                
                # Fire Webhook
                try:
                    requests.post(webhook, json=payload, timeout=5)
                    
                    # Update Lead state
                    db.client.table("leads").update({
                        "last_followup_minutes": target_rule['min']
                    }).eq("id", lead['id']).execute()
                    
                except Exception as e:
                    print(f"[FollowUp] Failed to fire webhook: {e}")

        except Exception as e:
            print(f"[FollowUp] Error checking lead {lead.get('id')}: {e}")
