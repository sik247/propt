-- Create user_api_keys table
create table if not exists public.user_api_keys (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    service text not null,
    api_key_encrypted text not null,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_api_keys enable row level security;

-- Create policies
create policy "Users can view their own API keys"
    on public.user_api_keys for select
    using (auth.uid() = user_id);

create policy "Users can insert their own API keys"
    on public.user_api_keys for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own API keys"
    on public.user_api_keys for update
    using (auth.uid() = user_id);

create policy "Users can delete their own API keys"
    on public.user_api_keys for delete
    using (auth.uid() = user_id);

-- Create indexes
create index if not exists user_api_keys_user_id_idx on public.user_api_keys(user_id);
create index if not exists user_api_keys_service_idx on public.user_api_keys(service);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.user_api_keys
    for each row
    execute procedure public.handle_updated_at();
