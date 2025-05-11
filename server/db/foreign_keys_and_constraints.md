Foreign keys and constraints for each table



profiles

[
  {
    "constraint_name": "profiles_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "profiles",
    "column_name": "id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "constraint_name": "profiles_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "profiles",
    "column_name": "id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  }
]

modules

[
  {
    "constraint_name": "modules_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "modules",
    "column_name": "id",
    "foreign_table_name": "modules",
    "foreign_column_name": "id"
  }
]

sections

[
  {
    "constraint_name": "sections_module_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "sections",
    "column_name": "module_id",
    "foreign_table_name": "modules",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "sections_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "sections",
    "column_name": "id",
    "foreign_table_name": "sections",
    "foreign_column_name": "id"
  }
]

user_progress

[
  {
    "constraint_name": "user_progress_module_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_progress",
    "column_name": "module_id",
    "foreign_table_name": "modules",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "user_progress_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "user_progress",
    "column_name": "id",
    "foreign_table_name": "user_progress",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "user_progress_section_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_progress",
    "column_name": "section_id",
    "foreign_table_name": "sections",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "user_progress_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_progress",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "constraint_name": "user_progress_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_progress",
    "column_name": "user_id",
    "foreign_table_name": "user_progress",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_progress_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_progress",
    "column_name": "user_id",
    "foreign_table_name": "user_progress",
    "foreign_column_name": "section_id"
  },
  {
    "constraint_name": "user_progress_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_progress",
    "column_name": "section_id",
    "foreign_table_name": "user_progress",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_progress_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_progress",
    "column_name": "section_id",
    "foreign_table_name": "user_progress",
    "foreign_column_name": "section_id"
  }
]

plans

[
  {
    "constraint_name": "plans_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "plans",
    "column_name": "id",
    "foreign_table_name": "plans",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "plans_plan_type_key",
    "constraint_type": "UNIQUE",
    "table_name": "plans",
    "column_name": "plan_type",
    "foreign_table_name": "plans",
    "foreign_column_name": "plan_type"
  },
  {
    "constraint_name": "plans_stripe_price_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "plans",
    "column_name": "stripe_price_id",
    "foreign_table_name": "plans",
    "foreign_column_name": "stripe_price_id"
  }
]

subscriptions

[
  {
    "constraint_name": "subscriptions_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "subscriptions",
    "column_name": "id",
    "foreign_table_name": "subscriptions",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "subscriptions_plan_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "subscriptions",
    "column_name": "plan_id",
    "foreign_table_name": "plans",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "subscriptions_stripe_customer_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "subscriptions",
    "column_name": "stripe_customer_id",
    "foreign_table_name": "subscriptions",
    "foreign_column_name": "stripe_customer_id"
  },
  {
    "constraint_name": "subscriptions_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "subscriptions",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "constraint_name": "subscriptions_user_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "subscriptions",
    "column_name": "user_id",
    "foreign_table_name": "subscriptions",
    "foreign_column_name": "user_id"
  }
]

payments

[
  {
    "constraint_name": "payments_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "payments",
    "column_name": "id",
    "foreign_table_name": "payments",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "payments_subscription_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "payments",
    "column_name": "subscription_id",
    "foreign_table_name": "subscriptions",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "payments_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "payments",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  }
]

security_events

[
  {
    "constraint_name": "security_events_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "security_events",
    "column_name": "id",
    "foreign_table_name": "security_events",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "security_events_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "security_events",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  }
]
config

[
  {
    "constraint_name": "config_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "config",
    "column_name": "key",
    "foreign_table_name": "config",
    "foreign_column_name": "key"
  }
]

user_bookmarks
 
[
  {
    "constraint_name": "user_bookmarks_module_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_bookmarks",
    "column_name": "module_id",
    "foreign_table_name": "modules",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "user_bookmarks_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "user_bookmarks",
    "column_name": "user_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_bookmarks_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "user_bookmarks",
    "column_name": "user_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "module_id"
  },
  {
    "constraint_name": "user_bookmarks_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "user_bookmarks",
    "column_name": "module_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_bookmarks_pkey",
    "constraint_type": "PRIMARY KEY",
    "table_name": "user_bookmarks",
    "column_name": "module_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "module_id"
  },
  {
    "constraint_name": "user_bookmarks_section_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_bookmarks",
    "column_name": "section_id",
    "foreign_table_name": "sections",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "user_bookmarks_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "table_name": "user_bookmarks",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "constraint_name": "user_bookmarks_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_bookmarks",
    "column_name": "user_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_bookmarks_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_bookmarks",
    "column_name": "user_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "section_id"
  },
  {
    "constraint_name": "user_bookmarks_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_bookmarks",
    "column_name": "section_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "user_id"
  },
  {
    "constraint_name": "user_bookmarks_user_id_section_id_key",
    "constraint_type": "UNIQUE",
    "table_name": "user_bookmarks",
    "column_name": "section_id",
    "foreign_table_name": "user_bookmarks",
    "foreign_column_name": "section_id"
  }
]