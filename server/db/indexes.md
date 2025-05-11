Profile indexes

profiles
[
  {
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  }
]

modules

[
  {
    "indexname": "modules_pkey",
    "indexdef": "CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id)"
  }
]

sections

[
  {
    "indexname": "sections_pkey",
    "indexdef": "CREATE UNIQUE INDEX sections_pkey ON public.sections USING btree (id)"
  }
]

user_progress

[
  {
    "indexname": "user_progress_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_progress_pkey ON public.user_progress USING btree (id)"
  },
  {
    "indexname": "user_progress_user_id_section_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_progress_user_id_section_id_key ON public.user_progress USING btree (user_id, section_id)"
  },
  {
    "indexname": "user_progress_user_section_unique_idx",
    "indexdef": "CREATE UNIQUE INDEX user_progress_user_section_unique_idx ON public.user_progress USING btree (user_id, section_id)"
  }
]

plans

[
  {
    "indexname": "plans_pkey",
    "indexdef": "CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id)"
  },
  {
    "indexname": "plans_stripe_price_id_key",
    "indexdef": "CREATE UNIQUE INDEX plans_stripe_price_id_key ON public.plans USING btree (stripe_price_id)"
  },
  {
    "indexname": "plans_plan_type_key",
    "indexdef": "CREATE UNIQUE INDEX plans_plan_type_key ON public.plans USING btree (plan_type)"
  }
]

subscriptions

[
  {
    "indexname": "subscriptions_pkey",
    "indexdef": "CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id)"
  },
  {
    "indexname": "subscriptions_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions USING btree (user_id)"
  },
  {
    "indexname": "subscriptions_stripe_customer_id_key",
    "indexdef": "CREATE UNIQUE INDEX subscriptions_stripe_customer_id_key ON public.subscriptions USING btree (stripe_customer_id)"
  }
]

payments

[
  {
    "indexname": "payments_pkey",
    "indexdef": "CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id)"
  }
]

security_events

[
  {
    "indexname": "security_events_pkey",
    "indexdef": "CREATE UNIQUE INDEX security_events_pkey ON public.security_events USING btree (id)"
  }
]

config

[
  {
    "indexname": "config_pkey",
    "indexdef": "CREATE UNIQUE INDEX config_pkey ON public.config USING btree (key)"
  }
]

user_bookmarks

[
  {
    "indexname": "user_bookmarks_user_id_section_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_bookmarks_user_id_section_id_key ON public.user_bookmarks USING btree (user_id, section_id)"
  },
  {
    "indexname": "user_bookmarks_user_module_unique_idx",
    "indexdef": "CREATE UNIQUE INDEX user_bookmarks_user_module_unique_idx ON public.user_bookmarks USING btree (user_id, module_id)"
  },
  {
    "indexname": "user_bookmarks_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_bookmarks_pkey ON public.user_bookmarks USING btree (user_id, module_id)"
  }
]