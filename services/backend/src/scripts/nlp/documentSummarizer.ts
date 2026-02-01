export class DocumentSummarizer {
    constructor() { }

    async summarize(text: string): Promise<string> {
        return "Summary placeholder";
    }
}

export const documentSummarizer = new DocumentSummarizer();
