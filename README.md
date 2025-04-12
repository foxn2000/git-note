# GitNote: GitHub Repository Analysis Report Generator

GitNote is a web application that analyzes a given GitHub repository and generates a comprehensive report covering its usage, installation, structure, and code logic using AI. It fetches repository information from uithub.com and utilizes the Cerebras API for analysis.

## Features

*   Analyzes public GitHub repositories.
*   Generates reports in multiple languages (currently supports English and Japanese, with potential for others).
*   Provides insights into:
    *   **Usage:** How to use the repository.
    *   **Installation:** Setup and environment configuration.
    *   **Repository Structure:** Directory layout and key files.
    *   **Code Logic:** Core algorithms and implementation details.
*   Uses `react-markdown` and `react-syntax-highlighter` for clear report presentation.

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd git-note
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the project root by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file and add your Cerebras API key:
        ```env
        VITE_CEREBRAS_API_KEY="<your_cerebras_api_key>"
        ```
        You need to obtain an API key from [Cerebras](https://www.cerebras.net/).

## Usage

1.  **Start the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
2.  Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).
3.  Enter the GitHub repository name (e.g., `facebook/react`) and select the desired language for the report.
4.  Click "Analyze Repository".
5.  Wait for the analysis to complete. The generated report will be displayed on the page.

## Environment Variables

*   `VITE_CEREBRAS_API_KEY`: **Required.** Your API key for accessing the Cerebras API.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

[日本語版 README (Japanese README)](README_ja.md)
