import type { BlogBlock } from "@/lib/blog/posts"

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-medium text-[var(--mich-text)]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="mich-prose">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2 key={i} className="font-heading">
              {block.text}
            </h2>
          )
        }
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.items.map((item) => (
                <li key={item}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === "quote") {
          return (
            <blockquote key={i}>
              <RichText text={block.text} />
            </blockquote>
          )
        }
        return (
          <p key={i}>
            <RichText text={block.text} />
          </p>
        )
      })}
    </div>
  )
}
