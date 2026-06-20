/**
 * Hardcoded personalized Unify sequences for our top-3 champions — verbatim from the
 * "voice and AI" sequence built in Unify GTM (3 automatic-email steps each, personalized
 * to the champion's focus area). These are the people that go through when you enrol 3.
 */
export type SequenceStep = { type: "Automatic Email"; status: "Step scheduled"; subject: string; body: string };
export type ChampionSequence = { name: string; status: "Draft"; note: string; sender: string; mailbox: string; steps: SequenceStep[] };

function build(first: string, topicLong: string, topicShort: string): ChampionSequence {
  return {
    name: "Lightfern | Voice and AI",
    status: "Draft",
    note: "Your personalized Sequence is ready to launch. Approve to continue.",
    sender: "Luke Balabanovic",
    mailbox: "luke@delfa.ai",
    steps: [
      { type: "Automatic Email", status: "Step scheduled", subject: "voice and AI", body: `Hey ${first},\n\nMost people using AI for ${topicLong} hit the same tradeoff: getting the help without sanding off the way they naturally write.\n\nKeeping your own cadence and word choice intact is the edge Lightfern is built around.\n\nWe run a private Five-Email Test that takes about 12 minutes and checks whether AI suggestions for ${topicShort} still sound recognisably like you by the end. No sales call attached.\n\nOpen to trying it?\n\nBest,\nLuke` },
      { type: "Automatic Email", status: "Step scheduled", subject: "Re: voice and AI", body: `Hey ${first},\n\nThe part I keep coming back to is that this is not a generic AI writing demo.\n\nIt is a quick test of whether five real suggestions for ${topicShort} still feel like your voice by the end.\n\nIf useful, I can send the private Five-Email Test details. No sales call attached.\n\nWant me to?\n\nBest,\nLuke` },
      { type: "Automatic Email", status: "Step scheduled", subject: "Re: voice and AI", body: `Hey ${first},\n\nLast note from me on this.\n\nIf keeping your own voice while using AI for ${topicShort} is something you're thinking about, I can send the private Five-Email Test. If not, no worries and I can close the loop for now.\n\nOpen to that?\n\nBest,\nLuke` },
    ],
  };
}

/** The three champions (by email) that always go through, with their personalized sequence. */
export const CHAMPION_SEQUENCES: Record<string, ChampionSequence> = {
  "davide@clay.com": build("Davide", "growth emails and campaign copy", "growth copy"),
  "jenny@perplexity.ai": build("Jenny", "launch and messaging copy", "launch copy"),
  "brian@cursor.com": build("Brian", "revenue emails and follow-ups", "revenue emails"),
};

export const CHAMPION_EMAILS = Object.keys(CHAMPION_SEQUENCES);
export const isChampionEmail = (email?: string): boolean => !!email && CHAMPION_EMAILS.includes(email.toLowerCase());
export const sequenceForEmail = (email?: string): ChampionSequence | null => (email ? CHAMPION_SEQUENCES[email.toLowerCase()] ?? null : null);
