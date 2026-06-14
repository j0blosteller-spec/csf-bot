import {
  type Client,
  EmbedBuilder,
  type TextChannel,
  AttachmentBuilder,
} from "discord.js";
import { BOT_CONFIG } from "../config";
import { UNVERIFIED_ROLE_NAME } from "../handlers/verification";
import { logger } from "../../lib/logger";

export function registerWelcomeEvent(client: Client) {
  client.on("guildMemberAdd", async (member) => {
    try {
      // Auto-assign unverified role
      const unverifiedRole = member.guild.roles.cache.find(
        (r) => r.name === UNVERIFIED_ROLE_NAME
      );
      if (unverifiedRole) {
        await member.roles.add(unverifiedRole).catch(() => {});
      }

      const channel = member.guild.channels.cache.get(
        BOT_CONFIG.welcomeChannelId
      ) as TextChannel | undefined;

      if (!channel) {
        logger.warn("Welcome channel not found");
        return;
      }

      const memberCount = member.guild.memberCount;
      const logo = new AttachmentBuilder(`${__dirname}/csf-logo.png`, {
        name: "csf-logo.png",
      });

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: "Classic Sword Fight",
          iconURL: "attachment://csf-logo.png",
        })
        .setTitle(`👋 Welcome to CSF, ${member.user.username}!`)
        .setDescription(
          `Hey ${member}, welcome to **Classic Sword Fight**!\n\nWe're glad to have you here. Head to the verify channel to unlock all channels!`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "👤 Member", value: member.user.username, inline: true },
          { name: "🎉 You are member", value: `#${memberCount}`, inline: true },
          {
            name: "📅 Account Created",
            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
            inline: true,
          }
        )
        .setFooter({ text: "CSF Community" })
        .setTimestamp();

      await channel.send({ embeds: [embed], files: [logo] });
    } catch (err) {
      logger.error({ err }, "Failed to handle member join");
    }
  });
}
