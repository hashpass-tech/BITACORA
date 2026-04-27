// Simple in-memory store for Bitácora app state
export type SessionMode = "Conference" | "Lecture" | "Meeting" | "Podcast";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  timestamp: string;
}

export interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  highlightedTerms?: string[];
}

export interface BriefSection {
  id: string;
  label: string;
  content: string;
}

export interface Bitacora {
  id: string;
  name: string;
  mode: SessionMode;
  context?: string;
  createdAt: string;
  duration?: string;
  transcript: TranscriptLine[];
  glossary: GlossaryTerm[];
  brief?: BriefSection[];
  status: "active" | "completed";
}

// Mock data for demo purposes
export const MOCK_SESSIONS: Bitacora[] = [
  {
    id: "1",
    name: "AI & The Future of Work Panel",
    mode: "Conference",
    createdAt: "2025-01-15T14:30:00Z",
    duration: "48 min",
    status: "completed",
    context: "Product manager interested in AI automation",
    transcript: [
      {
        id: "t1",
        timestamp: "00:02:14",
        speaker: "Speaker 1",
        text: "The convergence of large language models and traditional enterprise software is creating unprecedented opportunities for automation.",
        highlightedTerms: ["large language models", "automation"],
      },
      {
        id: "t2",
        timestamp: "00:04:32",
        speaker: "Speaker 2",
        text: "We're seeing a paradigm shift where RAG architectures are replacing traditional search in most enterprise contexts.",
        highlightedTerms: ["RAG architectures", "paradigm shift"],
      },
      {
        id: "t3",
        timestamp: "00:08:15",
        speaker: "Speaker 1",
        text: "The key insight is that agentic workflows don't just automate tasks — they create entirely new categories of work.",
        highlightedTerms: ["agentic workflows"],
      },
    ],
    glossary: [
      {
        id: "g1",
        term: "Large Language Models",
        definition:
          "AI systems trained on vast text datasets capable of generating and understanding human language.",
        timestamp: "00:02:14",
      },
      {
        id: "g2",
        term: "RAG Architecture",
        definition:
          "Retrieval-Augmented Generation — a technique combining document retrieval with generative AI for accurate responses.",
        timestamp: "00:04:32",
      },
      {
        id: "g3",
        term: "Agentic Workflows",
        definition:
          "AI-driven processes where models autonomously plan and execute multi-step tasks.",
        timestamp: "00:08:15",
      },
    ],
    brief: [
      {
        id: "b1",
        label: "Key Themes",
        content:
          "AI automation is transforming enterprise software. The panel agreed that LLMs are moving beyond chatbots into active workflow participants. RAG architectures are the dominant pattern for enterprise search replacement.",
      },
      {
        id: "b2",
        label: "Notable Takeaways",
        content:
          "Agentic workflows represent a new paradigm — not just automation but creation of new work categories. Organizations should pilot RAG in low-stakes environments first. Human oversight remains critical in the near term.",
      },
      {
        id: "b3",
        label: "Action Items",
        content:
          "Evaluate RAG vendors for enterprise search replacement. Build internal AI literacy program. Schedule follow-up session on agentic workflow implementation.",
      },
    ],
  },
  {
    id: "2",
    name: "Distributed Systems Lecture",
    mode: "Lecture",
    createdAt: "2025-01-12T10:00:00Z",
    duration: "62 min",
    status: "completed",
    transcript: [
      {
        id: "t1",
        timestamp: "00:05:10",
        speaker: "Professor",
        text: "The CAP theorem states that a distributed system can only guarantee two of three properties: consistency, availability, and partition tolerance.",
        highlightedTerms: ["CAP theorem", "consistency", "partition tolerance"],
      },
      {
        id: "t2",
        timestamp: "00:12:44",
        speaker: "Professor",
        text: "In practice, network partitions are unavoidable, so the real trade-off is between CP and AP systems — consistency vs availability.",
        highlightedTerms: ["CP systems", "AP systems"],
      },
    ],
    glossary: [
      {
        id: "g1",
        term: "CAP Theorem",
        definition:
          "Theorem stating a distributed system cannot simultaneously guarantee Consistency, Availability, and Partition Tolerance.",
        timestamp: "00:05:10",
      },
      {
        id: "g2",
        term: "Partition Tolerance",
        definition:
          "A system's ability to continue operating despite network partitions or message loss between nodes.",
        timestamp: "00:05:10",
      },
    ],
    brief: [
      {
        id: "b1",
        label: "Core Concepts",
        content:
          "CAP theorem fundamentals: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network failures).",
      },
      {
        id: "b2",
        label: "Review Questions",
        content:
          "1. Explain why you must choose between CP and AP in practice. 2. Give examples of databases optimized for each. 3. How does eventual consistency address the CAP trade-off?",
      },
    ],
  },
  {
    id: "3",
    name: "Q1 Product Roadmap Review",
    mode: "Meeting",
    createdAt: "2025-01-10T15:00:00Z",
    duration: "34 min",
    status: "completed",
    transcript: [
      {
        id: "t1",
        timestamp: "00:03:22",
        speaker: "Maria",
        text: "We've decided to prioritize the mobile redesign in Q1, pushing the API marketplace to Q2.",
        highlightedTerms: ["mobile redesign", "API marketplace"],
      },
    ],
    glossary: [],
    brief: [
      {
        id: "b1",
        label: "Decisions",
        content:
          "Mobile redesign prioritized for Q1. API marketplace deferred to Q2. Design system audit approved.",
      },
      {
        id: "b2",
        label: "Action Items",
        content:
          "Maria: Finalize mobile spec by Jan 20. Dev team: Set up design system repo. Product: Update public roadmap.",
      },
      {
        id: "b3",
        label: "Owners",
        content: "Mobile redesign: Sarah Chen. API marketplace: Dev team lead. Design system: Maria.",
      },
    ],
  },
];

export const getModeColor = (mode: SessionMode) => {
  switch (mode) {
    case "Conference":
      return { bg: "rgba(124,58,237,0.1)", text: "#7C3AED", border: "#7C3AED" };
    case "Lecture":
      return { bg: "rgba(67,56,202,0.1)", text: "#4338CA", border: "#4338CA" };
    case "Meeting":
      return { bg: "rgba(13,148,136,0.1)", text: "#0D9488", border: "#0D9488" };
    case "Podcast":
      return { bg: "rgba(217,119,6,0.1)", text: "#D97706", border: "#D97706" };
  }
};

export const getModeIcon = (mode: SessionMode) => {
  switch (mode) {
    case "Conference":
      return "Users";
    case "Lecture":
      return "BookOpen";
    case "Meeting":
      return "MessageSquare";
    case "Podcast":
      return "Mic";
  }
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
