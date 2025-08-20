-- Additional tables for token usage and pricing system

-- User subscriptions/plans
CREATE TABLE user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  tokens_included INTEGER NOT NULL DEFAULT 1000,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  tokens_remaining INTEGER GENERATED ALWAYS AS (tokens_included - tokens_used) STORED,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  subscription_start TIMESTAMPTZ DEFAULT NOW(),
  subscription_end TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'openai', 'anthropic', etc.
  api_key_encrypted TEXT, -- Store encrypted
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token usage tracking
CREATE TABLE token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'generate', 'refine', 'browse'
  tokens_used INTEGER NOT NULL,
  cost_usd DECIMAL(10,4), -- Cost in USD
  api_provider TEXT NOT NULL, -- 'platform', 'user_openai'
  model_used TEXT, -- 'gpt-4', 'gpt-3.5-turbo', etc.
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing plans configuration
CREATE TABLE pricing_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  tokens_included INTEGER NOT NULL,
  features JSONB, -- Additional features
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing plans
INSERT INTO pricing_plans (plan_name, display_name, price_monthly, price_yearly, tokens_included, features) VALUES
('free', 'Free', 0.00, 0.00, 1000, '{"features": ["Basic prompt generation", "1,000 tokens/month", "Community support"]}'),
('basic', 'Basic', 9.99, 99.99, 10000, '{"features": ["Advanced prompt generation", "10,000 tokens/month", "Email support", "Prompt history"]}'),
('pro', 'Pro', 29.99, 299.99, 50000, '{"features": ["Unlimited prompt generation", "50,000 tokens/month", "Priority support", "Advanced analytics", "API access"]}'),
('enterprise', 'Enterprise', 99.99, 999.99, 200000, '{"features": ["Custom solutions", "200,000 tokens/month", "Dedicated support", "Custom integrations", "SSO"]}');

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own plans" ON user_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own API keys" ON user_api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own token usage" ON token_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view active pricing plans" ON pricing_plans FOR SELECT USING (is_active = true);

-- Function to create default plan for new users
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_plans (user_id, plan_type, tokens_included)
  VALUES (NEW.id, 'free', 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default plan when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_plan();

-- Function to deduct tokens
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_action_type TEXT,
  p_model_used TEXT DEFAULT 'gpt-4',
  p_cost_usd DECIMAL DEFAULT 0.00
)
RETURNS BOOLEAN AS $$
DECLARE
  current_plan RECORD;
BEGIN
  -- Get current user plan
  SELECT * INTO current_plan 
  FROM user_plans 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Check if user has enough tokens
  IF current_plan.tokens_remaining < p_tokens THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct tokens
  UPDATE user_plans 
  SET tokens_used = tokens_used + p_tokens,
      updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Log usage
  INSERT INTO token_usage (user_id, action_type, tokens_used, cost_usd, api_provider, model_used)
  VALUES (p_user_id, p_action_type, p_tokens, p_cost_usd, 'platform', p_model_used);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
