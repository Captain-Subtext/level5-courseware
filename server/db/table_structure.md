Table structure in prod:
profiles

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "full_name",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "nickname",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "avatar_url",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "avatar_color",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "email_preferences",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "column_default": "'{\"marketing\": true, \"accountChanges\": true, \"contentUpdates\": true}'::jsonb",
    "is_nullable": "YES"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES"
  },
  {
    "column_name": "subscription_tier",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  }
]

modules

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "title",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "order_index",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]

Sections

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "module_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "title",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "content",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "duration",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "order_index",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]

user_progress

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "module_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "section_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "completed",
    "data_type": "boolean",
    "character_maximum_length": null,
    "column_default": "false",
    "is_nullable": "YES"
  },
  {
    "column_name": "completed_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "last_visited",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "notes",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]

plans

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "name",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "currency",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": "'usd'::text",
    "is_nullable": "NO"
  },
  {
    "column_name": "interval",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "interval_count",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": "1",
    "is_nullable": "NO"
  },
  {
    "column_name": "stripe_price_id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "stripe_product_id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "active",
    "data_type": "boolean",
    "character_maximum_length": null,
    "column_default": "true",
    "is_nullable": "NO"
  },
  {
    "column_name": "features",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "plan_type",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]

subscriptions

[
  {
    "column_name": "id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "plan_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "stripe_customer_id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "status",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "current_period_start",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "current_period_end",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "cancel_at_period_end",
    "data_type": "boolean",
    "character_maximum_length": null,
    "column_default": "false",
    "is_nullable": "YES"
  },
  {
    "column_name": "canceled_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "ended_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "trial_start",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "trial_end",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]

payments

[
  {
    "column_name": "id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "subscription_id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "stripe_customer_id",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "amount",
    "data_type": "numeric",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "amount_received",
    "data_type": "numeric",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "currency",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "status",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "payment_method_types",
    "data_type": "ARRAY",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "billing_reason",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "invoice_pdf",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "hosted_invoice_url",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "paid_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]


security_events

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "event_type",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "ip_address",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "details",
    "data_type": "jsonb",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "severity",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": "'info'::text",
    "is_nullable": "YES"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]


config

[
  {
    "column_name": "key",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "value",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  }
]


user_bookmarks

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "section_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "module_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "CURRENT_TIMESTAMP",
    "is_nullable": "YES"
  },
  {
    "column_name": "notes",
    "data_type": "text",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES"
  }
]

