-- AI Settings columns on businesses table
alter table businesses
  add column if not exists ai_instructions text,
  add column if not exists ai_tone text default 'friendly',
  add column if not exists ai_language text default 'en',
  add column if not exists ai_emoji_enabled boolean default true,
  add column if not exists ai_enabled boolean default true;
