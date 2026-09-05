import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import cron from "node-cron";
import { getCat } from "./commands/cat.js";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("bot is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

console.log(
  `the path to the commands folder: ${commandsPath}, and the path to the files: ${commandFiles}`,
);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  console.log(`commands: ${filePath}`);
  const fileUrl = pathToFileURL(filePath).href;
  console.log(`fileUrl: ${fileUrl}`);

  const commandModule = await import(fileUrl);
  const command = commandModule.default;
  console.log(command);
  client.commands.set(command.data.name, command);
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  cron.schedule("0 9 * * *", async () => {
    console.log("Sending daily cat image...");
    try {
      const canal = await client.channels.fetch(process.env.CHANNEL_ID);
      if (canal) {
        const [fact, image] = await getCat();
        const embed = new EmbedBuilder()
          .setTitle("daily cat fact:")
          .setDescription(fact)
          .setImage(image)
          .setColor("Green");
        await canal.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
    }
  });

  try {
    console.log("trying to save commands...");

    const commandsData = Array.from(client.commands.values()).map((command) =>
      command.data.toJSON(),
    );

    const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.application.id), {
      body: commandsData,
    });
    console.log("commands saved.");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.BOT_TOKEN);
