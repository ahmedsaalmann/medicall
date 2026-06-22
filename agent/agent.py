import os
import asyncio
from typing import TypedDict, List, Dict, Any, Literal, Sequence
from pydantic import BaseModel, Field

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

# Import tools
from agent.utils.tools import medical_rag_tool, web_search_tool

# Define the State representing the medical conversation context
class AgentState(TypedDict):
    messages: List[BaseMessage]        # Conversation message stream
    current_query: str                  # Current question/symptom description being handled
    route_decision: str                 # Selected pathway ('rag', 'web', 'both', 'direct')
    retrieved_context: str             # Textbook passages returned by Book.pdf RAG tool
    web_context: str                   # Online articles returned by DDG Web Search tool
    final_response: str                # Final polished medical diagnosis/answer generated

# Structured model for the router node's classifier
class RouteDecisionSchema(BaseModel):
    decision: Literal["rag", "web", "both", "direct"] = Field(
        description="The routing destination for the doctor's query. "
                    "'rag' for standard textbook definitions, medical structures, and textbook conditions. "
                    "'web' for recent 2026 updates, live news, or modern public health data. "
                    "'both' for queries requiring textbook background with up-to-date online observations. "
                    "'direct' for greetings, casual chat, or questions unrelated to clinical diagnoses."
    )

# Robust Medical Persona System Instructions for Gemini
MEDICAL_SYSTEM_PROMPT = """أنت "MediBlaze"، المساعد الطبي الذكي والمحترف الموثوق للغاية.
هدفك الأساسي هو تقديم إرشادات طبية دقيقة ومنظمة باللغة العربية الفصحى المبسطة لمساعدة وبث الطمأنينة في نفوس المرضى العرب.

دليل صياغة الإجابات واللغة (Adhere strictly to these guidelines):
1. اللغة والأسلوب: يجب أن تكون جميع إجاباتك باللغة العربية الفصحى المبسطة، وبلهجة داعمة، حانية، ومطمئنة للغاية (Supportive, empathetic & reassuring tone).
2. المصطلحات الطبية والعلمية: يجب كتابة أي مصطلح طبي، اسم مرض، اسم دواء، أو مفهوم علمي مهم باللغة الإنجليزية في قوسين بجوار الترجمة العربية مباشرة (e.g. مركب الأسيتامينوفين (Acetaminophen) أو مرض السكري (Diabetes)).
3. الهيكلية والتنظيم: ابدأ دائماً بجملة ترحيبية دافئة تطمئن المريض. استخدم عناوين وتنسيق Markdown واضح باللغة العربية:
   - نبذة علمية وتعريف (Clinical Highlights & Definition)
   - الأعراض والعلامات (Symptoms & Signs)
   - الأسباب وعوامل الخطر (Causes & Risk Factors)
   - الفحوصات والتشخيص (Typical Diagnostics & Tests)
   - العلاج والنصائح العامة (Treatment & General Advice)
4. حدود عملك وحماية الخصوصية:
   - إذا سألك المستخدم في أي موضوع غير طبي (coding, history, sports, etc.)، اعتذر بأدب ووضح أنك مساعد طبي متخصص فقط.
   - في نهاية كل رد طبي بلا استثناء، يجب وضع هذا التنويه حرفياً:
     "تنويه: هذه المعلومات للإرشاد والتوعية فقط، ولا تغني عن استشارة الطبيب المختص أو الحصول على الرعاية الطبية الفورية."
"""

# Active Gemini LLM initialization using helper
def get_llm(temperature: float = 0.2):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing.")
    # Initialize the LangChain ChatGoogleGenerativeAI wrapper
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=gemini_key,
        temperature=temperature
    )

# --- NODES ---

async def router_node(state: AgentState) -> dict:
    """
    Analyzes the user's current query to predict the optimal diagnostic routing:
    rag, web, both, or direct content generation.
    """
    query = state.get("current_query") or ""
    llm = get_llm(temperature=0.0)
    
    # Configure structured classifier
    structured_llm = llm.with_structured_output(RouteDecisionSchema)
    
    classification_prompt = (
        "Identify the perfect route for this medical query. "
        "Analyze whether the question requires deep clinical/textbook medical reference (rag), "
        "current live knowledge, recent medical news, or updates (web), "
        "a blend of textbook foundations and up-to-date clinical practices (both), "
        "or is simple conversation/general greetings (direct).\n\n"
        f"Query: {query}"
    )
    
    try:
        response = await structured_llm.ainvoke([
            SystemMessage(content="You are an expert medical routing classifier."),
            HumanMessage(content=classification_prompt)
        ])
        decision = response.decision
    except Exception:
        # Fallback parsing in case of API failure
        decision = "both" # Safe default
        
    return {
        "route_decision": decision
    }

async def retrieve_rag(state: AgentState) -> dict:
    """
    Invocates the RAG search tool over Pinecone.
    """
    query = state.get("current_query") or ""
    context = await medical_rag_tool.ainvoke({"query": query})
    return {
        "retrieved_context": context
    }

async def call_web_search(state: AgentState) -> dict:
    """
    Invocates DuckDuckGo medical search tool.
    """
    query = state.get("current_query") or ""
    web_results = await web_search_tool.ainvoke({"query": query})
    return {
        "web_context": web_results
    }

async def generate_answer(state: AgentState) -> dict:
    """
    Combines retrieved book context with web resources to generate a safe, cite-able,
    and structures medical diagnosis from Google Gemini.
    """
    query = state.get("current_query") or ""
    rag_ctx = state.get("retrieved_context") or ""
    web_ctx = state.get("web_context") or ""
    
    # Construct combined evidence block
    context_block = ""
    if rag_ctx and not rag_ctx.startswith("RAG System Pending"):
        context_block += f"### Primary Reference material (GALE Encyclopedia of Medicine):\n{rag_ctx}\n\n"
    if web_ctx:
        context_block += f"### Up-to-date Diagnostic Web Observations:\n{web_ctx}\n\n"
        
    user_prompt = f"Patient Query / Question: {query}\n\n"
    if context_block:
        user_prompt += f"Consult the context below to create your diagnostic response:\n{context_block}"
    else:
        user_prompt += "Proceed with standard professional medical training guidance."
        
    lessons = [
        SystemMessage(content=MEDICAL_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ]
    
    llm = get_llm(temperature=0.3)
    response = await llm.ainvoke(lessons)
    
    return {
        "final_response": response.content
    }

# --- CONDITIONAL EDGES ---

def route_after_router(state: AgentState) -> str:
    decision = state.get("route_decision", "direct")
    if decision == "rag" or decision == "both":
        return "retrieve_rag"
    elif decision == "web":
        return "call_web_search"
    else:
        return "generate_answer"

def route_after_rag(state: AgentState) -> str:
    decision = state.get("route_decision", "rag")
    if decision == "both":
        return "call_web_search"
    else:
        return "generate_answer"

# --- WORKFLOW COMPILATION ---

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("router_node", router_node)
workflow.add_node("retrieve_rag", retrieve_rag)
workflow.add_node("call_web_search", call_web_search)
workflow.add_node("generate_answer", generate_answer)

# Set Entrypoint
workflow.set_entry_point("router_node")

# Routing Edges
workflow.add_conditional_edges(
    "router_node",
    route_after_router,
    {
        "retrieve_rag": "retrieve_rag",
        "call_web_search": "call_web_search",
        "generate_answer": "generate_answer"
    }
)

workflow.add_conditional_edges(
    "retrieve_rag",
    route_after_rag,
    {
        "call_web_search": "call_web_search",
        "generate_answer": "generate_answer"
    }
)

workflow.add_edge("call_web_search", "generate_answer")
workflow.add_edge("generate_answer", END)

# Compile the final executable app
app = workflow.compile()
