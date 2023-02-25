<script lang="ts">
  import { CollectionEntry } from "astro:content";
  import moment from "moment";

  export let article: CollectionEntry<"articles">;
  export let type: "aside" | "inline" | "banner" = "banner";
</script>

<div
  class={`
    flex gap-2
    ${type === "aside" ? "flex-col" : ""}
    ${type === "inline" ? "lg:flex-row flex-col" : ""}
    ${type === "banner" ? "flex-col" : ""}
  `}
>
  <a class="block w-full" href={"/articles/" + article.slug}>
    <img
      class={`
        rounded-md shadow-md
        ${type !== "banner" ? "lg:w-sm w-full" : ""}
      `}
      src={article.data.banner}
      alt="banner"
    />
  </a>

  <div
    class={`
      p-4
      ${type === "aside" ? "p-1" : ""}
    `}
  >
    <a
      href={"/articles/" + article.slug}
      class={`
        block mb-4
        ${type === "aside" ? "mb-1" : ""}
      `}
    >
      <h2 class="font-bold text-xl mb-2">
        {article.data.title}
      </h2>

      {#if type !== "aside"}
        <p class="text-lg opacity-70">{article.body.slice(0, 180)}</p>
      {/if}
    </a>

    <div class="flex items-center gap-2">
      <img
        class="w-12 rounded-full"
        src={article.data.profileImage}
        alt="author"
      />

      <div>
        <span class="font-bold">{article.data.authors[0]}</span>
        <span class="opacity-50">({article.data.role})</span>

        <br />

        <span class="opacity-30">
          {moment(article.data.publishDate).fromNow()}
        </span>
      </div>
    </div>
  </div>
</div>
