import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  pgEnum,
  integer,
  index,
  unique,
  customType,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return JSON.parse(trimmed);
        }
        return JSON.parse(value);
      } catch {
        const cleaned = value.replace(/[\[\]]/g, '').split(',').map(Number);
        return cleaned.filter(n => !isNaN(n));
      }
    }
    return [];
  },
});

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member"]);
export const assistantStatusEnum = pgEnum("assistant_status", [
  "active",
  "inactive",
  "archived",
]);
export const logLevelEnum = pgEnum("log_level", [
  "info",
  "warning",
  "error",
  "debug",
]);

export const callOutcomeEnum = pgEnum("call_outcome", [
  "completed",
  "abandoned",
  "voicemail",
  "busy",
  "failed",
  "transferred",
]);

export const callDirectionEnum = pgEnum("call_direction", [
  "inbound",
  "outbound",
]);

export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    livekitApiKey: text("livekit_api_key"),
    livekitApiSecret: text("livekit_api_secret"),
    livekitProjectId: text("livekit_project_id"),
    livekitUrl: text("livekit_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("orgs_slug_idx").on(table.slug),
  })
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    role: userRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("org_memberships_user_id_idx").on(table.userId),
    orgIdIdx: index("org_memberships_org_id_idx").on(table.orgId),
    userOrgIdx: index("org_memberships_user_org_idx").on(
      table.userId,
      table.orgId
    ),
  })
);

export const assistants = pgTable(
  "assistants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt"),
    status: assistantStatusEnum("status").default("active").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    workflowEnabled: boolean("workflow_enabled").default(false).notNull(),
    workflowId: uuid("workflow_id"),
    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("assistants_org_id_idx").on(table.orgId),
    statusIdx: index("assistants_status_idx").on(table.status),
  })
);

export const kb = pgTable(
  "kb",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    text: text("text"),
    fileUrl: text("file_url"),
    embedding: vector("embedding").$type<number[]>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("kb_org_id_idx").on(table.orgId),
  })
);

export const kbChunks = pgTable(
  "data_kb_chunks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    nodeId: text("node_id"),
    text: text("text").notNull(),
    metadata: jsonb("metadata_").$type<Record<string, unknown>>(),
    embedding: vector("embedding").$type<number[]>().notNull(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    kbId: uuid("kb_id")
      .references(() => kb.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("kb_chunks_org_id_idx").on(table.orgId),
    kbIdIdx: index("kb_chunks_kb_id_idx").on(table.kbId),
  })
);

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("tools_org_id_idx").on(table.orgId),
    typeIdx: index("tools_type_idx").on(table.type),
  })
);

export const logs = pgTable(
  "logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    assistantId: uuid("assistant_id").references(() => assistants.id, {
      onDelete: "set null",
    }),
    level: logLevelEnum("level").default("info").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("logs_org_id_idx").on(table.orgId),
    assistantIdIdx: index("logs_assistant_id_idx").on(table.assistantId),
    createdAtIdx: index("logs_created_at_idx").on(table.createdAt),
    levelIdx: index("logs_level_idx").on(table.level),
  })
);

export const callSessions = pgTable(
  "call_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    assistantId: uuid("assistant_id")
      .references(() => assistants.id, { onDelete: "set null" }),
    phoneNumberId: uuid("phone_number_id")
      .references(() => phoneNumbers.id, { onDelete: "set null" }),
    direction: callDirectionEnum("direction").notNull(),
    callerNumber: text("caller_number"),
    calleeNumber: text("callee_number"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // seconds
    outcome: callOutcomeEnum("outcome"),
    recordingUrl: text("recording_url"),
    transferTarget: text("transfer_target"),
    sentimentScore: numeric("sentiment_score", { precision: 3, scale: 2 }).$type<number>(), // -1.00 to 1.00

    // Transcript fields
    transcript: text("transcript"),
    transcriptUrl: text("transcript_url"),

    // Recording fields (enhanced)
    recordingFileUrl: text("recording_file_url"),
    recordingSignedUrl: text("recording_signed_url"),
    recordingSignedUrlExpiry: timestamp("recording_signed_url_expiry"),
    
    latency: integer("latency"), // ms

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("call_sessions_org_id_idx").on(table.orgId),
    assistantIdIdx: index("call_sessions_assistant_id_idx").on(table.assistantId),
    phoneNumberIdIdx: index("call_sessions_phone_number_id_idx").on(table.phoneNumberId),
    startTimeIdx: index("call_sessions_start_time_idx").on(table.startTime),
    outcomeIdx: index("call_sessions_outcome_idx").on(table.outcome),
    directionIdx: index("call_sessions_direction_idx").on(table.direction),
  })
);

// Post-call analysis table
export const callAnalysis = pgTable(
  "call_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callSessionId: uuid("call_session_id")
      .references(() => callSessions.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),

    // Pre-defined analysis fields
    summary: text("summary"),
    actionItems: text("action_items"),
    keyPoints: text("key_points"),

    // Custom analysis fields by type
    booleanAnalysis: jsonb("boolean_analysis").$type<Record<string, boolean>>(),
    textAnalysis: jsonb("text_analysis").$type<Record<string, string>>(),
    numberAnalysis: jsonb("number_analysis").$type<Record<string, number>>(),
    selectorAnalysis: jsonb("selector_analysis").$type<Record<string, string>>(),

    // Additional metadata
    analysisMetadata: jsonb("analysis_metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    callSessionIdIdx: index("call_analysis_call_session_id_idx").on(table.callSessionId),
    orgIdIdx: index("call_analysis_org_id_idx").on(table.orgId),
  })
);

// Transcript segments for time-stamped transcripts
export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callSessionId: uuid("call_session_id")
      .references(() => callSessions.id, { onDelete: "cascade" })
      .notNull(),

    speaker: text("speaker").notNull(), // 'agent' | 'user' | 'system'
    text: text("text").notNull(),
    startTime: numeric("start_time", { precision: 10, scale: 3 }).notNull(), // seconds from call start
    endTime: numeric("end_time", { precision: 10, scale: 3 }).notNull(),

    sentiment: numeric("sentiment", { precision: 3, scale: 2 }), // -1.00 to 1.00
    confidence: numeric("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    callSessionIdIdx: index("transcript_segments_call_session_id_idx").on(table.callSessionId),
    startTimeIdx: index("transcript_segments_start_time_idx").on(table.startTime),
  })
);

// Analysis field definitions (configurable by org)
export const analysisDefinitions = pgTable(
  "analysis_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),

    name: text("name").notNull(),
    description: text("description"),
    fieldKey: text("field_key").notNull(), // unique key for JSON storage

    // Type: 'boolean' | 'text' | 'number' | 'selector'
    type: text("type").notNull(),

    // For selector type: array of possible values
    selectorOptions: jsonb("selector_options").$type<string[]>(),

    // AI prompt for analysis
    analysisPrompt: text("analysis_prompt"),

    enabled: boolean("enabled").default(true).notNull(),

    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("analysis_definitions_org_id_idx").on(table.orgId),
    fieldKeyIdx: index("analysis_definitions_field_key_idx").on(table.fieldKey),
    orgFieldKeyIdx: unique("analysis_definitions_org_field_key_unique").on(table.orgId, table.fieldKey),
  })
);

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    assistantId: uuid("assistant_id")
      .references(() => assistants.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    name: text("name").notNull(),
    description: text("description"),
    config: jsonb("config").$type<Record<string, unknown>>(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("workflows_org_id_idx").on(table.orgId),
    assistantIdIdx: index("workflows_assistant_id_idx").on(table.assistantId),
  })
);

export const workflowNodes = pgTable(
  "workflow_nodes",
  {
    id: text("id").primaryKey(),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    positionX: integer("position_x").notNull(),
    positionY: integer("position_y").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_nodes_workflow_id_idx").on(table.workflowId),
  })
);

export const workflowEdges = pgTable(
  "workflow_edges",
  {
    id: text("id").primaryKey(),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),
    sourceNodeId: text("source_node_id").notNull(),
    targetNodeId: text("target_node_id").notNull(),
    sourceHandle: text("source_handle"),
    condition: text("condition"),
    priority: integer("priority").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflow_edges_workflow_id_idx").on(table.workflowId),
  })
);

export const phoneNumbers = pgTable(
  "phone_numbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    livekitPhoneNumberId: text("livekit_phone_number_id").notNull().unique(),
    e164Format: text("e164_format").notNull(),
    countryCode: text("country_code").notNull(),
    areaCode: text("area_code"),
    numberType: text("number_type").notNull(),
    locality: text("locality"),
    region: text("region"),
    capabilities: jsonb("capabilities").$type<string[]>(),
    status: text("status").notNull(),
    sipDispatchRuleId: text("sip_dispatch_rule_id"),
    assignedAt: timestamp("assigned_at"),
    releasedAt: timestamp("released_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("phone_numbers_org_id_idx").on(table.orgId),
    livekitIdIdx: index("phone_numbers_livekit_phone_number_id_idx").on(table.livekitPhoneNumberId),
  })
);

export const sipConnectedNumbers = pgTable(
  "sip_connected_numbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => orgs.id, { onDelete: "cascade" })
      .notNull(),
    e164: text("e164").notNull(),
    nickname: text("nickname"),
    /** Optional: only needed for outbound trunk. For inbound (Twilio → agent), leave empty. */
    terminationUri: text("termination_uri"),
    sipTrunkUsername: text("sip_trunk_username"),
    sipTrunkPassword: text("sip_trunk_password"),
    transport: text("transport").notNull().default("TCP"),
    livekitDispatchRuleId: text("livekit_dispatch_rule_id"),
    /** Inbound trunk ID: calls to this number hit the agent (Twilio → LiveKit). */
    livekitInboundTrunkId: text("livekit_inbound_trunk_id"),
    /** Outbound trunk ID: agent places calls out via this trunk (LiveKit → Twilio/Telnyx). */
    livekitOutboundTrunkId: text("livekit_outbound_trunk_id"),
    /** SIP provider: 'twilio' | 'telnyx'. Affects setup instructions and outbound trunk config. */
    provider: text("provider").notNull().default("twilio"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("sip_connected_numbers_org_id_idx").on(table.orgId),
    orgE164Unique: unique("sip_connected_numbers_org_id_e164_unique").on(table.orgId, table.e164),
  })
);

export const orgsRelations = relations(orgs, ({ many }) => ({
  memberships: many(orgMemberships),
  assistants: many(assistants),
  kb: many(kb),
  tools: many(tools),
  logs: many(logs),
  workflows: many(workflows),
  phoneNumbers: many(phoneNumbers),
  sipConnectedNumbers: many(sipConnectedNumbers),
  callSessions: many(callSessions),
  callAnalysis: many(callAnalysis),
  analysisDefinitions: many(analysisDefinitions),
}));

export const phoneNumbersRelations = relations(phoneNumbers, ({ one, many }) => ({
  org: one(orgs, {
    fields: [phoneNumbers.orgId],
    references: [orgs.id],
  }),
  callSessions: many(callSessions),
}));

export const sipConnectedNumbersRelations = relations(sipConnectedNumbers, ({ one }) => ({
  org: one(orgs, {
    fields: [sipConnectedNumbers.orgId],
    references: [orgs.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  memberships: many(orgMemberships),
  createdAssistants: many(assistants),
  createdKb: many(kb),
  createdTools: many(tools),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const orgMembershipsRelations = relations(orgMemberships, ({ one }) => ({
  user: one(users, {
    fields: [orgMemberships.userId],
    references: [users.id],
  }),
  org: one(orgs, {
    fields: [orgMemberships.orgId],
    references: [orgs.id],
  }),
}));

export const assistantsRelations = relations(assistants, ({ one, many }) => ({
  org: one(orgs, {
    fields: [assistants.orgId],
    references: [orgs.id],
  }),
  creator: one(users, {
    fields: [assistants.createdBy],
    references: [users.id],
  }),
  logs: many(logs),
  workflows: many(workflows),
  callSessions: many(callSessions),
}));

export const kbRelations = relations(kb, ({ one, many }) => ({
  org: one(orgs, {
    fields: [kb.orgId],
    references: [orgs.id],
  }),
  creator: one(users, {
    fields: [kb.createdBy],
    references: [users.id],
  }),
  chunks: many(kbChunks),
}));

export const kbChunksRelations = relations(kbChunks, ({ one }) => ({
  kb: one(kb, {
    fields: [kbChunks.kbId],
    references: [kb.id],
  }),
  org: one(orgs, {
    fields: [kbChunks.orgId],
    references: [orgs.id],
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  org: one(orgs, {
    fields: [tools.orgId],
    references: [orgs.id],
  }),
  creator: one(users, {
    fields: [tools.createdBy],
    references: [users.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  org: one(orgs, {
    fields: [logs.orgId],
    references: [orgs.id],
  }),
  assistant: one(assistants, {
    fields: [logs.assistantId],
    references: [assistants.id],
  }),
}));

export const callSessionsRelations = relations(callSessions, ({ one, many }) => ({
  org: one(orgs, {
    fields: [callSessions.orgId],
    references: [orgs.id],
  }),
  assistant: one(assistants, {
    fields: [callSessions.assistantId],
    references: [assistants.id],
  }),
  phoneNumber: one(phoneNumbers, {
    fields: [callSessions.phoneNumberId],
    references: [phoneNumbers.id],
  }),
  analysis: one(callAnalysis, {
    fields: [callSessions.id],
    references: [callAnalysis.callSessionId],
  }),
  transcriptSegments: many(transcriptSegments),
}));

export const callAnalysisRelations = relations(callAnalysis, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [callAnalysis.callSessionId],
    references: [callSessions.id],
  }),
  org: one(orgs, {
    fields: [callAnalysis.orgId],
    references: [orgs.id],
  }),
}));

export const transcriptSegmentsRelations = relations(transcriptSegments, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [transcriptSegments.callSessionId],
    references: [callSessions.id],
  }),
}));

export const analysisDefinitionsRelations = relations(analysisDefinitions, ({ one }) => ({
  org: one(orgs, {
    fields: [analysisDefinitions.orgId],
    references: [orgs.id],
  }),
  creator: one(users, {
    fields: [analysisDefinitions.createdBy],
    references: [users.id],
  }),
}));


export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  org: one(orgs, {
    fields: [workflows.orgId],
    references: [orgs.id],
  }),
  assistant: one(assistants, {
    fields: [workflows.assistantId],
    references: [assistants.id],
  }),
  nodes: many(workflowNodes),
  edges: many(workflowEdges),
}));

export const workflowNodesRelations = relations(workflowNodes, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowNodes.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowEdgesRelations = relations(workflowEdges, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowEdges.workflowId],
    references: [workflows.id],
  }),
}));
