🇳🇬 Civic Budget Intelligence Platform

A citizen-focused digital governance platform that aggregates, structures, and makes Nigerian federal budget and policy documents accessible through search, categorization, and AI-powered insights.

🎯 Project Purpose

Public policy and budget documents are often:

scattered across government websites

difficult to navigate

written in highly technical language

This project solves that by:

continuously collecting official budget documents

structuring them into a searchable database

enabling citizens, researchers, and civil society to explore, understand, and monitor public spending and fiscal policy

The platform is designed as a proof-of-concept for digital governance, transparency, and civic tech innovation.

🧩 Key Features
📄 Document Aggregation

Automated scraping of official Nigerian budget sources

Supports multiple years and document types

Periodic updates via scheduled workflows

🗂 Structured Categorization


Each document includes:

title

publication date

official source links (download, view, details)

AI Summary

🔍 Advanced Search

Keyword-based filtering

Category-based browsing

AI-assisted semantic search (planned / experimental)

🔔 Keyword Subscriptions

Users can subscribe to keywords

Future updates notify subscribers when new relevant documents are added

🤖 AI Interaction (Planned)

Natural-language questions over public documents

AI-generated summaries and explanations

Citizen-friendly interpretations of fiscal data

🏗️ Architecture Overview
Government Websites
        ↓
  Scraping & Parsing
        ↓
     n8n Workflows
        ↓
   Airtable (Database)
        ↓
 Public API (Webhooks)
        ↓
 React Frontend (Vercel)

⚙️ Tech Stack
Backend / Automation

n8n – workflow automation, scraping, parsing, APIs

Firecrawl – website scraping & markdown extraction

Airtable – structured document storage

Frontend

React – UI and routing

Tailwind CSS – styling

Vercel – deployment

AI (Experimental / Planned)

LLM-based document summarization

Semantic search over policy texts

🌍 Deployment

Frontend: Vercel

Backend workflows: Self-hosted n8n

Data source: Official Nigerian government budget portals

Client-side routing is handled using SPA rewrites for deep linking (e.g. /documents/:id).

🧠 Design Philosophy

Citizen-first: Built for accessibility, not just experts

Transparent: Links back to original government sources

Modular: Each component (scraping, storage, UI, AI) is independently extensible

Low-cost & scalable: Built with no-code and lightweight tools where possible

🚀 Future Improvements

Full AI-powered policy summarization

Impact analysis (who does a policy affect?)

Email / Telegram notifications for subscriptions

Visual analytics (charts, budget breakdowns)

Additional data sources (CBN circulars, Acts, Bills)

🎓 Academic Context

This project was developed as part of an academic and professional portfolio, demonstrating applied software engineering, digital governance innovation, and civic technology problem-solving. It aligns with interests in public sector technology, transparency, and citizen engagement.

📜 Disclaimer

This project is an independent civic tech initiative.
All documents are sourced from publicly available government websites and remain the property of their respective institutions.