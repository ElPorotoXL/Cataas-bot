import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const CATAAS_URL = "https://cataas.com/cat";
const FACT_CAT_URL = "https://catfact.ninja/fact";

export async function getCat() {
  const fact = await fetch(FACT_CAT_URL);
  const factData = await fact.json();

  const catImage = await fetch("https://cataas.com/cat?json=true");
  const catImageData = await catImage.json();

  console.log(catImageData);

  const imageUrl = catImageData.url;
  return [factData.fact, imageUrl];
}

export default {
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Replies with a cat image!"),
  async execute(interaction) {
    const [fact, image] = await getCat();
    const embed = new EmbedBuilder()
      .setTitle("Here's a fact:")
      .setDescription(fact)
      .setImage(image)
      .setColor("Green");
    await interaction.reply({ embeds: [embed] });
  },
};
