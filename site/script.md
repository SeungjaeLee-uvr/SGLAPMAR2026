# 10-Minute Presentation Script

## Slide 1 - Opening (0:30)

Good morning. I am Seungjae Lee from KAIST UVR Lab. This work asks a simple systems question: once an AR or VR runtime already produces scene graphs, how can we keep their history without storing every full state?

We present an incremental snapshot manager that records only accepted changes and reconstructs temporal scene states offline. The central idea is straightforward: keep the real-time loop small, preserve explicit transitions, and give later applications access to more than the latest graph.

## Slide 2 - The Missing History (0:50)

Scene graphs are already common representations for objects, anchors, users, zones, and their relations. For immediate rendering, the newest graph may be enough. But the moment we ask to restore, replay, compare, debug, or query the past, the latest state is no longer sufficient.

Storing every complete graph solves the access problem, but repeats unchanged content and still forces each downstream tool to infer transitions. Our goal is to preserve those transitions once, in a form that multiple XR applications can reuse.

## Slide 3 - System Boundary (0:50)

Our scope is intentionally narrow. We do not introduce a new tracking, mapping, or scene-understanding algorithm. We assume an upstream runtime, shared-space service, simulation, or authoring tool supplies complete scene graphs.

Two assumptions matter. First, node identities should remain stable within one history, so a moved object is patched rather than removed and re-added. Second, edge identity is derived from source, relation type, and target.

Given that interface, the manager decides which graph states to preserve and exposes explicit histories to downstream tools. This separation allows the producer and the temporal consumers to evolve independently.

## Slide 4 - Online and Offline Paths (0:50)

The architecture separates a bounded online path from a heavier offline path. Online, Unity canonicalizes each complete graph and compares it with the last accepted state. If nothing changed, the sample is skipped. Otherwise, the recorder computes node- and edge-level differences and appends operation records to a JSON Lines file.

Offline, the Python materializer loads the external initial scene, validates sequence order, groups operations by accepted snapshot boundary, and reconstructs graph states. It then produces transition replay, aggregate comparison, and final-state outputs. This keeps long-history work away from the real-time XR loop.

## Slide 5 - Incremental Transition Model (0:45)

Each history starts from an externally supplied initial scene, G zero. Every accepted transition is represented by one or more operation records. The prototype supports five operations: update, add, or remove a node, and add or remove an edge.

Node updates are sparse property patches, so unchanged fields are not treated as authoritative. Records from the same capture share a snapshot identifier and timestamp. This distinction is important: one JSONL line is not a scene state. The complete transition group is the accepted boundary that produces the next state.

## Slide 6 - Unity Snapshot Recorder (0:50)

The Unity recorder has three bounded steps. First, it extracts a complete graph with stable identities, transforms, and relations. Second, it builds a deterministic signature from sorted node properties and edge identities. If that signature matches the last accepted graph, the attempt is skipped.

When the graph changed, the recorder computes a sparse diff against the previous accepted state. It appends completed node and edge operations immediately, then advances the accepted boundary. The configured capture rate is therefore a maximum observation rate, not a guarantee that every attempt becomes history.

## Slide 7 - Durable Log and Materializer (0:40)

The durable interface is append-only JSONL. Because each completed operation is written as one line, a recording remains readable during production and the materializer can ignore an incomplete final line after an interruption.

Offline, the Python tool checks ordering, groups operations by snapshot identifier, applies sparse patches from the external initial scene, and exports playback, aggregate difference, and final-state documents. Unity can then replay the materialized transitions as GameObject updates, while other consumers can reuse the same history.

## Slide 8 - Evaluation Design (0:50)

We first evaluate four controlled Unity workloads. They total 126 seconds and begin from seven-node scenes. Short Sparse isolates brief object motions with unchanged windows. Medium Staggered alternates single and paired motion. Long Complex extends this structure. Original Choreography keeps all objects active and creates the densest history.

We also run a randomized four-by-four-by-five factorial study: four workloads, rates from 10 to 120 captures per minute, and five repetitions, for 80 runs. Every run ends with a forced changed-state capture so endpoint accuracy can be tested separately from intermediate sampling density.

## Slide 9 - Reconstruction and Latency (0:45)

Across 67 nominal observation opportunities, the system records 61 accepted transition groups, skips six unchanged opportunities, and stores 155 operations. These include 135 node updates and 20 edge additions or removals. The materializer reconstructs all four final scenes, and all 13 snapshot-management regression tests pass.

Mean end-to-end restore stays below 7.2 milliseconds for these small histories. This establishes internal consistency across filtering, grouping, reconstruction, and replay, rather than large-scale deployment performance.

## Slide 10 - Storage Trade-off (1:00)

Storage is the conditional result. Sparse workloads use 0.46 to 0.67 times the bytes of compact reconstructed full states. Across all four workloads, the aggregate ratio is 0.86. But the continuously changing choreography uses 1.68 times as many bytes.

The reason is transparent JSON overhead. Every operation repeats sequence metadata, identifiers, timestamps, operation names, and field names. Sparse changes amortize this cost; dense changes do not. Highly dynamic scenes may therefore favor periodic full snapshots, hybrid checkpoints, or grouped binary encodings.

## Slide 11 - Capture-Rate Trade-off (1:00)

Increasing capture rate changes how much intermediate structure is retained. From 10 to 120 captures per minute, accepted groups per run increase from 6.25 to 52.2, while mean log size grows from 12.8 to 85.3 kilobytes. More unchanged attempts are also filtered at higher rates.

The number of recorded relation operations rises from 4.35 to 7.45 on average, showing that finer sampling can expose transient relations that coarse sampling misses. Yet all 80 runs recover the final graph, with zero position error and 100 percent final relation recall. In these controlled runs, capture rate buys temporal resolution, not a more correct endpoint.

## Slide 12 - Takeaway (1:10)

To conclude, this work contributes a narrow systems layer between real-time scene production and offline temporal access. It filters unchanged states, records explicit node and edge operations, reconstructs accepted histories, and supports restore, replay, comparison, and query.

The main lesson is conditional. Incremental JSONL is compact and transparent when changes are sparse, but dense scenes can favor periodic full snapshots, hybrid checkpoints, or grouped binary encodings. The current study is controlled and assumes stable identities, one ordered writer, and small histories. Our next steps are deployed XR traces, transactional transition boundaries, checkpoints, multi-producer ordering, and stronger indexing.

In short, we do not make the final scene graph smarter. We make its history available. Thank you, and I welcome your questions.
