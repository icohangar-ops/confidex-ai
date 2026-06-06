use spacetimedb::{ReducerContext, Table, Timestamp};

// ──────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────

/// 1. DealRoom — top-level deal container
#[spacetimedb::table(accessor = deal_room, public)]
#[derive(Debug, Clone)]
pub struct DealRoom {
    #[primary_key]
    pub deal_id: u64,
    pub name: String,
    pub owner_id: String,
    pub state: String,
    pub threshold: u64,
    pub participant_count: u64,
    pub created_at: Timestamp,
}

/// 2. DealParticipant — who's in the deal
#[spacetimedb::table(accessor = deal_participant, public)]
#[derive(Debug, Clone)]
pub struct DealParticipant {
    #[primary_key]
    pub participant_id: u64,
    pub deal_id: u64,
    pub address: String,
    pub role: String,
    pub authorized_until: u64,
    pub access_level: u64,
}

/// 3. Document — documents uploaded to a deal room
#[spacetimedb::table(accessor = document, public)]
#[derive(Debug, Clone)]
pub struct Document {
    #[primary_key]
    pub doc_id: u64,
    pub deal_id: u64,
    pub name: String,
    pub content_hash: String,
    pub encrypted_data_cid: String,
    pub uploader: String,
    pub uploaded_at: Timestamp,
    pub doc_type: String,
}

/// 4. AnalysisRequest — AI analysis task
#[spacetimedb::table(accessor = analysis_request, public)]
#[derive(Debug, Clone)]
pub struct AnalysisRequest {
    #[primary_key]
    pub request_id: u64,
    pub doc_id: u64,
    pub deal_id: u64,
    pub agent_id: String,
    pub analysis_type: String,
    pub status: String,
    pub created_at: Timestamp,
}

/// 5. AnalysisResult — AI analysis result
#[spacetimedb::table(accessor = analysis_result, public)]
#[derive(Debug, Clone)]
pub struct AnalysisResult {
    #[primary_key]
    pub result_id: u64,
    pub request_id: u64,
    pub summary_text: String,
    pub risk_score: f64,
    pub confidence: f64,
    pub raw_findings: String,
    pub submitted_at: Timestamp,
}

/// 6. AccessLog — immutable audit trail
#[spacetimedb::table(accessor = access_log, public)]
#[derive(Debug, Clone)]
pub struct AccessLog {
    #[primary_key]
    pub log_id: u64,
    pub deal_id: u64,
    pub participant_id: u64,
    pub action: String,
    pub timestamp: Timestamp,
    pub doc_id: u64,
}

/// 7. AuditorAssignment — time-bound auditor document access
#[spacetimedb::table(accessor = auditor_assignment, public)]
#[derive(Debug, Clone)]
pub struct AuditorAssignment {
    #[primary_key]
    pub assignment_id: u64,
    pub deal_id: u64,
    pub auditor_id: String,
    pub doc_ids: String,
    pub expires_at: u64,
    pub active: bool,
}

// ──────────────────────────────────────────────
// Auto-increment helpers
// ──────────────────────────────────────────────

fn next_id(iter: impl Iterator<Item = u64>) -> u64 {
    iter.max().unwrap_or(0) + 1
}

// ──────────────────────────────────────────────
// Lifecycle hooks
// ──────────────────────────────────────────────

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("Confidex AI SpacetimeDB module initialized");
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) {
    log::info!("Client connected: {:?}", ctx.sender());
}

#[spacetimedb::reducer(client_disconnected)]
pub fn identity_disconnected(_ctx: &ReducerContext) {
    log::info!("Client disconnected");
}

// ──────────────────────────────────────────────
// Reducers
// ──────────────────────────────────────────────

/// 1. create_deal_room — Creates a new deal room with owner and initial participants
#[spacetimedb::reducer]
pub fn create_deal_room(
    ctx: &ReducerContext,
    name: String,
    owner_id: String,
    participants: String,
    threshold: u64,
) {
    let deal_id = next_id(ctx.db.deal_room().iter().map(|r| r.deal_id));
    let now = ctx.timestamp;

    ctx.db.deal_room().insert(DealRoom {
        deal_id,
        name: name.clone(),
        owner_id: owner_id.clone(),
        state: "Created".into(),
        threshold,
        participant_count: 0,
        created_at: now,
    });

    log::info!("Deal room created: id={}, name={}", deal_id, name);

    let participant_addrs: Vec<String> = serde_json::from_str(&participants).unwrap_or_default();

    for addr in &participant_addrs {
        let pid = next_id(ctx.db.deal_participant().iter().map(|p| p.participant_id));
        ctx.db.deal_participant().insert(DealParticipant {
            participant_id: pid,
            deal_id,
            address: addr.clone(),
            role: "Auditor".into(),
            authorized_until: u64::MAX,
            access_level: 1,
        });
    }

    // Update participant count via delete + insert (no generic update on table handle)
    let existing = ctx.db.deal_room().deal_id().find(deal_id).unwrap();
    ctx.db.deal_room().deal_id().update(DealRoom {
        participant_count: participant_addrs.len() as u64,
        ..existing
    });

    log::info!(
        "Added {} participants to deal room {}",
        participant_addrs.len(),
        deal_id
    );
}

/// 2. upload_document — Record a document's availability in a deal room
#[spacetimedb::reducer]
pub fn upload_document(
    ctx: &ReducerContext,
    deal_id: u64,
    name: String,
    content_hash: String,
    encrypted_cid: String,
    doc_type: String,
) {
    let _room = ctx.db.deal_room().deal_id().find(deal_id)
        .unwrap_or_else(|| panic!("Deal room {} not found", deal_id));

    let doc_id = next_id(ctx.db.document().iter().map(|d| d.doc_id));
    let now = ctx.timestamp;
    let uploader = format!("{:?}", ctx.sender());

    ctx.db.document().insert(Document {
        doc_id,
        deal_id,
        name,
        content_hash,
        encrypted_data_cid: encrypted_cid,
        uploader,
        uploaded_at: now,
        doc_type,
    });

    log::info!("Document uploaded: doc_id={}, deal_id={}", doc_id, deal_id);
}

/// 3. request_analysis — Create an AI analysis request for a document
#[spacetimedb::reducer]
pub fn request_analysis(
    ctx: &ReducerContext,
    doc_id: u64,
    deal_id: u64,
    agent_id: String,
    analysis_type: String,
) {
    let _doc = ctx.db.document().doc_id().find(doc_id)
        .unwrap_or_else(|| panic!("Document {} not found", doc_id));

    let request_id = next_id(ctx.db.analysis_request().iter().map(|r| r.request_id));
    let now = ctx.timestamp;

    ctx.db.analysis_request().insert(AnalysisRequest {
        request_id,
        doc_id,
        deal_id,
        agent_id,
        analysis_type,
        status: "Pending".into(),
        created_at: now,
    });

    log::info!("Analysis request created: request_id={}", request_id);
}

/// 4. submit_analysis — AI agent submits analysis result
#[spacetimedb::reducer]
pub fn submit_analysis(
    ctx: &ReducerContext,
    request_id: u64,
    summary: String,
    risk_score: f64,
    confidence: f64,
    findings: String,
) {
    // Update request status via primary key
    let existing = ctx.db.analysis_request().request_id().find(request_id)
        .unwrap_or_else(|| panic!("Analysis request {} not found", request_id));
    ctx.db.analysis_request().request_id().update(AnalysisRequest {
        status: "Completed".into(),
        ..existing
    });

    let result_id = next_id(ctx.db.analysis_result().iter().map(|r| r.result_id));
    let now = ctx.timestamp;

    ctx.db.analysis_result().insert(AnalysisResult {
        result_id,
        request_id,
        summary_text: summary,
        risk_score,
        confidence,
        raw_findings: findings,
        submitted_at: now,
    });

    log::info!(
        "Analysis submitted: result_id={}, request_id={}",
        result_id,
        request_id
    );
}

/// 5. grant_access — Grant time-bound document access to an auditor
#[spacetimedb::reducer]
pub fn grant_access(
    ctx: &ReducerContext,
    deal_id: u64,
    auditor: String,
    doc_ids: String,
    duration_blocks: u64,
) {
    let _room = ctx.db.deal_room().deal_id().find(deal_id)
        .unwrap_or_else(|| panic!("Deal room {} not found", deal_id));

    let now = ctx.timestamp;
    let expires_at = now.to_micros_since_unix_epoch() as u64 / 1_000_000 + duration_blocks;

    let assignment_id = next_id(ctx.db.auditor_assignment().iter().map(|a| a.assignment_id));

    ctx.db.auditor_assignment().insert(AuditorAssignment {
        assignment_id,
        deal_id,
        auditor_id: auditor,
        doc_ids,
        expires_at,
        active: true,
    });

    log::info!(
        "Access granted: assignment_id={}, deal_id={}",
        assignment_id,
        deal_id
    );
}

/// 6. log_access — Record an immutable audit trail entry
#[spacetimedb::reducer]
pub fn log_access(
    ctx: &ReducerContext,
    deal_id: u64,
    participant_id: u64,
    action: String,
    doc_id: u64,
) {
    let log_id = next_id(ctx.db.access_log().iter().map(|l| l.log_id));
    let now = ctx.timestamp;

    ctx.db.access_log().insert(AccessLog {
        log_id,
        deal_id,
        participant_id,
        action,
        timestamp: now,
        doc_id,
    });

    log::info!("Access logged: log_id={}", log_id);
}
