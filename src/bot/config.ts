export const BOT_CONFIG = {
  guildId: "1515054762549313627",
  ticketPanelChannelId: "1515471550046802001",
  welcomeChannelId: "1515074918855872562",
  staffRoleIds: [
    "1515467837676847228",
    "1515467839077875903",
    "1515467839887118567",
  ],
  ticketCategories: [
    {
      id: "quick_question",
      label: "Questions",
      emoji: "❓",
      description: "Have a quick question?",
      subDescription: "Press **Questions** to open the matching ticket flow.",
      channelPrefix: "question",
    },
    {
      id: "discord_support",
      label: "Discord Support",
      emoji: "🎮",
      description: "Need help with Discord?",
      subDescription: "Press **Discord Support** to open the matching ticket flow.",
      channelPrefix: "discord-support",
    },
    {
      id: "game_support",
      label: "Game Support",
      emoji: "🕹️",
      description: "Need help with a game?",
      subDescription: "Press **Game Support** to open the matching ticket flow.",
      channelPrefix: "game-support",
    },
  ],
};
