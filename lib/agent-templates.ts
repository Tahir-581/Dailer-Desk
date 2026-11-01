import type { WorkflowNode, WorkflowEdge } from "@/lib/validations/workflow";

export type FlowStepIcon =
  | "greetings"
  | "screening"
  | "schedule"
  | "questions"
  | "refund"
  | "order";

export interface FlowStep {
  label: string;
  icon: FlowStepIcon;
}

export interface AgentTemplateSeed {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  flowSteps: FlowStep[];
  seed?: AgentTemplateSeed;
}

/** Start-from-blank: no seed; canvas will create default begin + welcome. */
export const BLANK_TEMPLATE_ID = "blank";

function makeSeed(
  welcomeTitle: string,
  transitions: string[]
): AgentTemplateSeed {
  const beginId = "begin-seed";
  const welcomeId = "welcome-seed";
  const edgeId = "edge-begin-welcome";
  return {
    nodes: [
      {
        id: beginId,
        type: "begin",
        position: { x: 120, y: 200 },
        data: {},
      },
      {
        id: welcomeId,
        type: "conversation",
        position: { x: 380, y: 200 },
        data: {
          title: welcomeTitle,
          transitions,
        },
      },
    ],
    edges: [
      {
        id: edgeId,
        source: beginId,
        target: welcomeId,
        data: { priority: 0 },
      },
    ],
  };
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: BLANK_TEMPLATE_ID,
    name: "Start from blank",
    description: "",
    flowSteps: [],
  },
  {
    id: "patient-screening",
    name: "Patient Screening",
    description: "Ask questions and log them in the post-call analysis.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Screening", icon: "screening" },
    ],
    seed: makeSeed("Greetings", ["Proceed to screening", "End call"]),
  },
  {
    id: "real-estate-lead-qualification",
    name: "Real Estate Lead Qualification",
    description: "Ask questions to qualify the leads and book an appointment.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Schedule", icon: "schedule" },
    ],
    seed: makeSeed("Greetings", ["Book appointment", "Not interested"]),
  },
  {
    id: "medical-center-receptionist",
    name: "Medical Center Receptionist",
    description: "Reschedule an appointment, answer pre-survey questions, etc.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Schedule", icon: "schedule" },
    ],
    seed: makeSeed("Greetings", ["Reschedule", "Pre-survey", "Other"]),
  },
  {
    id: "real-estate-appointment-setter",
    name: "Real Estate AI Appointment Setter",
    description: "Upsell real estate services and set an appointment.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Schedule", icon: "schedule" },
    ],
    seed: makeSeed("Greetings", ["Set appointment", "More info", "Decline"]),
  },
  {
    id: "delivery-customer-support",
    name: "Delivery Customer Support",
    description: "Handle refund requests, check order status, etc.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Refund", icon: "refund" },
    ],
    seed: makeSeed("Greetings", ["Refund request", "Order status", "Other"]),
  },
  {
    id: "dental-outbound-sales",
    name: "Dental Outbound Sales",
    description: "Outbound call to upsell dental services.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Questions", icon: "questions" },
    ],
    seed: makeSeed("Greetings", ["Interested", "Not interested", "Callback"]),
  },
  {
    id: "retail-receptionist",
    name: "Retail Receptionist",
    description: "Handle order status, purchase, etc.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Order", icon: "order" },
    ],
    seed: makeSeed("Greetings", ["Order status", "Purchase", "Returns"]),
  },
  {
    id: "education-program-appointment-setter",
    name: "Education Program Appointment Setter",
    description: "Outbound call to pre-qualify leads.",
    flowSteps: [
      { label: "Greetings", icon: "greetings" },
      { label: "Questions", icon: "questions" },
    ],
    seed: makeSeed("Greetings", ["Qualified", "Not qualified", "Schedule call"]),
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesForUi(): AgentTemplate[] {
  return AGENT_TEMPLATES;
}
