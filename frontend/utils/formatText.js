// Utility function to format text with markdown-style asterisks to HTML bold
export function formatMarkdownText(text) {
    if (!text) return '';

    // Convert **text** to <strong>text</strong>
    let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert *text* to <strong>text</strong> (for single asterisks)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    return formatted;
}

// Component to render formatted text
export function FormattedText({ children, className = '' }) {
    const formatted = formatMarkdownText(children);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: formatted }}
        />
    );
}
