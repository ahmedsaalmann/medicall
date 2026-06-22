import os
import asyncio
from typing import List, Dict, Any
from pinecone import Pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

# Expected Environment Variables:
# PINECONE_API_KEY - Auth token for Pinecone Vector Database
# PINECONE_INDEX_NAME - Name of index storing Book.pdf embeddings (defaults to 'mediblaze-index')
# GEMINI_API_KEY - API Key for Google Gemini Models

@tool
async def medical_rag_tool(query: str) -> str:
    """
    Retrieves the most relevant medical contexts and references from the textbook 
    'The GALE Encyclopedia of Medicine' (Book.pdf) matching the user's query.
    
    Args:
        query: A medical or health-related query/symptom description.
        
    Returns:
        Structured excerpts and facts extracted from the textbook.
    """
    try:
        api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX_NAME", "mediblaze-index")
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            return "RAG System Pending Configuration: PINECONE_API_KEY environment variable is not defined."
        if not gemini_api_key:
            return "RAG System Pending Configuration: GEMINI_API_KEY environment variable is not defined."
            
        # Initialize Pinecone vector client
        pc = Pinecone(api_key=api_key)
        index = pc.Index(index_name)
        
        # Instantiate embeddings generator using modern text-embedding-004 model
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=gemini_api_key
        )
        
        # Generate token embeddings in a non-blocking background thread
        loop = asyncio.get_running_loop()
        query_vector = await loop.run_in_executor(None, embeddings.embed_query, query)
        
        # Query the Pinecone index for top 5 matches
        query_response = await loop.run_in_executor(
            None,
            lambda: index.query(
                vector=query_vector,
                top_k=5,
                include_metadata=True
            )
        )
        
        matches = query_response.get("matches", [])
        if not matches:
            return "No matching records found in the medical textbook index."
            
        retrieved_texts = []
        for match in matches:
            metadata = match.get("metadata", {})
            text = metadata.get("text", "")
            page = metadata.get("page", "Unknown")
            score = match.get("score", 0.0)
            if text:
                retrieved_texts.append(
                    f"[Excerpt from the GALE Encyclopedia of Medicine, Page {page} (Similarity Score: {score:.2f})]:\n{text}"
                )
                
        return "\n\n---\n\n".join(retrieved_texts)
        
    except Exception as e:
        return f"Error executing Medical RAG retrieval or database index connection: {str(e)}"


@tool
async def web_search_tool(query: str) -> str:
    """
    Queries DuckDuckGo search to retrieve the most up-to-date and authoritative medical 
    observations and general health recommendations from the web.
    
    Args:
        query: General medical or health query search phrase.
        
    Returns:
        Consolidated snippets and text of resulting web matches.
    """
    try:
        search = DuckDuckGoSearchRun()
        loop = asyncio.get_running_loop()
        
        # Execute DuckDuckGo lookup as a non-blocking task
        results = await loop.run_in_executor(None, search.run, query)
        return results if results else "No diagnostic web search results were found."
    except Exception as e:
        return f"Error executing DuckDuckGo search query: {str(e)}"
