def calculate_cost(prompt_tokens, completion_tokens, model='gpt-4o-mini'):
    # Rates: $0.15/1M input, $0.60/1M output
    if model == 'gpt-4o-mini':
        input_rate = 0.15
        output_rate = 0.60
    else:
        input_rate = 0.15 # Fallback
        output_rate = 0.60

    cost = (prompt_tokens / 1_000_000 * input_rate) + (completion_tokens / 1_000_000 * output_rate)
    return cost

# Test Data from User screenshot: 2.5k tokens
# Assuming split 50/50 for estimation
p_tokens = 1250
c_tokens = 1250

cost = calculate_cost(p_tokens, c_tokens)
print(f"Tokens: {p_tokens+c_tokens} (In: {p_tokens}, Out: {c_tokens})")
print(f"Calculated Cost: ${cost:.6f}")
print(f"Rounded for UI (2 decimals): ${cost:.2f}")

# Check if 0.00 is expected for low volume
if cost < 0.01:
    print("WARNING: Cost is less than $0.01, so it shows as $0.00 in Dashboard.")
