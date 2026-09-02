import type { SeoPage } from "./seoPages";

export const featurePages: SeoPage[] = [
  {
    path: "/features/shared-storage/",
    title: "Shared Storage — Keep App State Across Cloud PCs | Noland",
    description:
      "Learn how Noland Shared Storage tracks application dependencies and personal state, creates encrypted bundles, and restores them on another cloud machine.",
    eyebrow: "Shared Storage",
    heading: "Take application state beyond one disposable machine",
    lede:
      "Noland observes how an application uses the Linux filesystem, turns relevant dependencies and personal state into encrypted bundles, and restores that state when you move to another compatible cloud host.",
    quickAnswer:
      "Shared Storage is Noland's application-aware backup and restore system. It associates files with the application sessions that read or changed them, excludes reconstructable and volatile operating-system data, encrypts the resulting bundle, and publishes a catalog that another Noland machine can restore.",
    highlights: [
      { value: "App-aware", label: "tracking and attribution" },
      { value: "Encrypted", label: "before cloud upload" },
      { value: "Portable", label: "across compatible Linux hosts" },
    ],
    sections: [
      {
        eyebrow: "Observe",
        heading: "Track behavior instead of relying on app-specific folder lists",
        paragraphs: [
          "Applications rarely keep everything under one obvious directory. An emulator, launcher, creative tool, or game can read executables and content from one location while writing configuration, databases, saves, or generated state somewhere else. Noland's Linux state agent observes process and filesystem activity and correlates those facts with the active application session.",
          "The observer reports facts such as process identity, operation, path, and time. The attribution and classification layers then decide what belongs in a backup. This keeps the mechanism generic: it can learn from an application's executable, child processes, reads, memory mappings, writes, creates, renames, truncates, and deletes without embedding a detector for each product.",
        ],
        bullets: [
          "Executed files and direct read dependencies can become complete-application content",
          "Writes and other mutations provide stronger persistent-state evidence",
          "Child and reparented processes remain associated with the application session",
          "Sockets, pipes, caches, locks, and other volatile data are excluded",
        ],
      },
      {
        eyebrow: "Bundle",
        heading: "Back up the complete application or only personal state",
        paragraphs: [
          "A complete-application export is intended to carry the application, directly used external content, configuration, and persistent state together. Personal-state mode focuses on user-created or mutated state while leaving reconstructable application and base-image content behind. The selected mode makes the tradeoff explicit instead of treating every file read as owned by the app.",
          "Noland indexes file state, chunks and packs content, reuses unchanged chunks, and records resumable transfer progress. Encryption happens before upload, and the cloud catalog is committed only after the bundle objects are available. A bundle that never completes its catalog commit is not presented as a successful restore point.",
        ],
        bullets: [
          "Complete application for executables, dependencies, content, and state",
          "Personal state for saves, settings, and other mutations",
          "Incremental planning avoids re-uploading unchanged content",
          "Operation progress, cancellation, retry, and reconciliation are exposed to the client",
        ],
      },
      {
        eyebrow: "Restore",
        heading: "Restore launch-critical files first, then complete the bundle",
        paragraphs: [
          "Restore uses the bundle catalog to plan materialization on the destination Linux host. Launch-critical files can be restored first so the application reaches a ready-to-launch milestone before lower-priority content finishes. The complete phase then materializes the rest of the selected bundle with its recorded paths, permissions, and ownership mapping.",
          "Portability does not mean every host or application environment is interchangeable. The destination still needs compatible architecture, drivers, system packages, and runtime capabilities. Noland also cannot guarantee that third-party services, DRM, anti-cheat, or account-bound data will accept a moved environment.",
        ],
        links: [
          { href: "/features/display-manager/", label: "See how the remote display is managed" },
          { href: "/cloud-gaming-pc/", label: "Understand the complete cloud PC workflow" },
        ],
      },
    ],
    faqs: [
      {
        question: "Does Shared Storage upload every file an application reads?",
        answer:
          "No. Reads are dependency evidence, not automatic ownership. Noland combines process attribution, operation type, classification, backup mode, baseline information, and volatile-path exclusions before materializing a bundle.",
      },
      {
        question: "Can Shared Storage include an emulator, BIOS, game image, and save files?",
        answer:
          "A complete-application bundle can include an executable and external files directly used by its application session, together with persistent state it creates or changes. Inclusion is based on generic process and filesystem evidence rather than emulator-specific names.",
      },
      {
        question: "Is bundle content encrypted before upload?",
        answer:
          "Yes. Noland's bundle pipeline encrypts content before it is sent to the configured cloud storage backend. Temporary operation credentials are kept on the machine only for the active operation and are cleaned up afterward.",
      },
      {
        question: "Does restore automatically launch the application?",
        answer:
          "A normal restore materializes the bundle but does not automatically launch it. A launch-library flow can restore a cloud-only application first and then start it after the required state is ready.",
      },
    ],
  },
  {
    path: "/features/microphone/",
    title: "Microphone Passthrough to a Noland Cloud PC",
    description:
      "Learn how Noland captures a selected local microphone and forwards low-latency Opus audio to a persistent PipeWire microphone on the remote Linux host.",
    eyebrow: "Microphone passthrough",
    heading: "Use your local microphone inside the remote Linux session",
    lede:
      "Noland can capture a microphone selected on your client computer, send Opus audio through the managed connection, and expose it to remote applications as Noland Microphone.",
    quickAnswer:
      "Microphone passthrough runs alongside the Moonlight stream. A managed local sender captures the selected input, forwards RTP/Opus audio over ports authorized for the WireGuard peer, and a supervised receiver feeds a persistent PipeWire source on the cloud host.",
    highlights: [
      { value: "Opus", label: "compressed microphone audio" },
      { value: "WireGuard", label: "restricted peer path" },
      { value: "PipeWire", label: "remote virtual microphone" },
    ],
    sections: [
      {
        eyebrow: "Capture",
        heading: "Select the operating-system default or a specific input",
        paragraphs: [
          "The same managed sidecar that captures audio also enumerates available microphone devices. You can follow the operating-system default or select a specific device ID, then persist forwarding, auto-connect, device, and quality preferences per cloud instance.",
          "On Windows and Linux the sender captures through CPAL; on macOS it uses the managed GStreamer CoreAudio path and requests the system microphone permission. Capture enters a bounded stale-dropping queue so old audio does not grow into an unbounded delay when the downstream path is under pressure.",
        ],
        bullets: [
          "Default-device and explicit-device selection",
          "Per-instance forwarding and auto-connect preferences",
          "Bounded audio buffering that favors current speech",
          "Mute, unmute, reconnect, and device recreation controls",
        ],
      },
      {
        eyebrow: "Transport",
        heading: "Keep microphone transport separate from video streaming state",
        paragraphs: [
          "When a Moonlight session starts, Noland resolves the corresponding instance and schedules microphone startup independently. It authorizes a short-lived host endpoint over SSH, allocates RTP and RTCP ports, and restricts access to the WireGuard peer before starting the sender and receiver.",
          "The microphone service is supervised separately from Sunshine and Moonlight. Noland can report WireGuard reachability, local capture, queue health, packet loss, jitter, and remote PipeWire status independently, which makes failures more actionable than treating all audio problems as a single stream error.",
        ],
        bullets: [
          "RTP/RTCP transport with Opus audio",
          "Short-lived host authorization for the active peer",
          "Three-second sender supervision and bounded restart behavior",
          "Independent health metrics for each stage of the path",
        ],
      },
      {
        eyebrow: "Remote device",
        heading: "Present one stable microphone to remote applications",
        paragraphs: [
          "The receiver decodes the audio into a persistent PipeWire topology named Noland Microphone. Keeping the remote source stable lets applications continue targeting the same device while the client-side sender connects, disconnects, or is restarted.",
          "Microphone forwarding still depends on client permissions, local device drivers, network quality, WireGuard connectivity, and remote PipeWire health. It is designed for interactive voice use, but Noland does not promise studio recording quality or zero packet loss on every route.",
        ],
        links: [
          { href: "/features/moonlight-client-optimizations/", label: "Explore the optimized Moonlight client" },
          { href: "/sunshine-moonlight-cloud-gaming/", label: "Understand the streaming connection" },
        ],
      },
    ],
    faqs: [
      {
        question: "Does microphone passthrough use Moonlight's audio channel?",
        answer:
          "No. It is coordinated with the stream lifecycle but uses a separate managed RTP/Opus path and a remote PipeWire source.",
      },
      {
        question: "Can I choose a specific microphone?",
        answer:
          "Yes. Noland can follow the operating-system default input or persist a specific device exposed by the managed microphone sender.",
      },
      {
        question: "What appears inside the remote session?",
        answer:
          "Remote applications see a persistent PipeWire source called Noland Microphone. The sender and receiver can stop while the remote device topology remains available.",
      },
      {
        question: "Does microphone forwarding start automatically?",
        answer:
          "It can. Auto-connect is stored per instance and microphone startup is scheduled when the corresponding Moonlight session starts. Permission, device, network, or remote audio failures can still prevent activation.",
      },
    ],
  },
  {
    path: "/features/display-manager/",
    title: "Remote Display Manager for Noland Cloud Gaming",
    description:
      "Learn how Noland installs a client-aware virtual EDID, switches supported resolutions, and keeps Xorg and Sunshine aligned on a headless Linux host.",
    eyebrow: "Display Manager",
    heading: "Match the headless cloud display to your client",
    lede:
      "Noland manages the virtual display presented by the Linux host so Sunshine can stream a resolution appropriate for the client instead of depending on a physical monitor.",
    quickAnswer:
      "The Display Manager compares the host's current EDID profile with Noland's client-aware multi-resolution profile. It can install a new profile and restart Xorg and Sunshine when required, or use a faster resolution switch when the correct profile is already active.",
    highlights: [
      { value: "EDID", label: "headless display profile" },
      { value: "Xorg", label: "managed display session" },
      { value: "Fast path", label: "for compatible mode changes" },
    ],
    sections: [
      {
        eyebrow: "Detect",
        heading: "Read the host's real display state before changing it",
        paragraphs: [
          "The client asks the remote machine for its current mode, available resolutions, refresh information, EDID fingerprint, and Sunshine health. The UI uses that capability result to distinguish a compatible Noland display profile from a stale or different virtual display configuration.",
          "This avoids treating every resolution selection as the same operation. A machine with the expected multi-resolution EDID can usually switch modes without rebuilding the display stack, while a mismatched profile needs a controlled update.",
        ],
        bullets: [
          "Current and supported remote modes",
          "Client-native display profile comparison",
          "Explicit Sunshine and Xorg health verification",
          "Clear distinction between profile replacement and mode switching",
        ],
      },
      {
        eyebrow: "Apply",
        heading: "Use the least disruptive path that can produce the requested mode",
        paragraphs: [
          "When the remote host already advertises the current Noland multi-resolution EDID, applying another listed mode uses the fast switch path. If the profile differs, Noland installs the current client-native profile and briefly restarts Xorg and Sunshine so the virtual display and streaming host agree on the new capabilities.",
          "The operation verifies the resulting display and Sunshine state rather than assuming that a command returning successfully means the stream is ready. The selected display configuration is persisted so the managed session can be reconstructed after service or display-manager changes.",
        ],
        bullets: [
          "Fast resolution switching for an existing compatible profile",
          "Controlled Xorg and Sunshine restart when EDID changes",
          "Post-change verification before reporting success",
          "Persistent display selection for managed session recovery",
        ],
      },
      {
        eyebrow: "Limits",
        heading: "Resolution support still depends on the complete video path",
        paragraphs: [
          "Advertising a mode does not guarantee that every GPU, encoder, decoder, client display, network route, or game will sustain it. Stream resolution, frame rate, bitrate, codec support, local decoding, and the physical client display all contribute to the final experience.",
          "Noland manages a headless Xorg display for the provisioned Linux environment. It does not reconfigure the physical monitor attached to your client computer, and applying an EDID replacement can briefly interrupt an active remote desktop session.",
        ],
        links: [
          { href: "/features/moonlight-client-optimizations/", label: "See how frames are handled on the client" },
          { href: "/features/microphone/", label: "Add microphone passthrough to the session" },
        ],
      },
    ],
    faqs: [
      {
        question: "Why does a headless cloud machine need an EDID?",
        answer:
          "The virtual display stack needs monitor capabilities to expose usable resolutions and refresh modes. Noland supplies a managed profile because the cloud host normally has no physical monitor connected.",
      },
      {
        question: "Does every resolution change restart Xorg?",
        answer:
          "No. When the expected multi-resolution EDID is already active, Noland can use a faster mode switch. A different or stale profile requires installation and a controlled Xorg and Sunshine restart.",
      },
      {
        question: "Will changing the EDID interrupt the stream?",
        answer:
          "It can briefly interrupt the remote desktop because Xorg and Sunshine may need to restart. The UI identifies this path before applying the change and verifies service health afterward.",
      },
      {
        question: "Does selecting a high resolution guarantee smooth streaming?",
        answer:
          "No. Smooth playback also depends on host rendering and encoding, network bandwidth and loss, client decoding, stream settings, and the client display.",
      },
    ],
  },
  {
    path: "/features/moonlight-client-optimizations/",
    title: "Moonlight Client Optimizations in Noland",
    description:
      "Explore Noland's embedded Moonlight-compatible client, bounded queues, frame pacing controls, remote-safe packet sizing, telemetry, and controlled reconnect behavior.",
    eyebrow: "Moonlight client optimizations",
    heading: "A streaming client adapted for Noland's managed remote path",
    lede:
      "Noland embeds its Moonlight-compatible client and controls the native decode, presentation, telemetry, and reconnect lifecycle instead of sending video frames through the web interface.",
    quickAnswer:
      "Noland keeps the performance-critical stream in native code and adds bounded client-side controls around queueing, pacing, telemetry, remote packet sizing, and one-attempt recovery. Conservative defaults preserve known behavior until an optimization is explicitly enabled or validated for the platform.",
    highlights: [
      { value: "Native", label: "decode and presentation path" },
      { value: "Bounded", label: "queues and retry behavior" },
      { value: "Measured", label: "client and network telemetry" },
    ],
    sections: [
      {
        eyebrow: "Native pipeline",
        heading: "Keep frames out of Tauri and React",
        paragraphs: [
          "The embedded client connects to Sunshine using the Moonlight protocol while native platform code owns decoding and presentation. Tauri coordinates the session and exposes aggregate state, but compressed or decoded video frames do not travel through JSON, the webview, or React.",
          "This architecture lets each platform use its available media stack: Media Foundation and DXGI paths on Windows, GStreamer on Linux, and AVSampleBufferDisplayLayer on macOS. Platform capabilities differ, so Noland does not pretend that every optimization can be implemented safely on every backend.",
        ],
        bullets: [
          "Native decode and renderer ownership",
          "Fixed-size control and telemetry rings",
          "No per-frame JSON allocation in the hot path",
          "Platform-specific behavior with documented limits",
        ],
      },
      {
        eyebrow: "Latency controls",
        heading: "Bound buffering and make pacing behavior explicit",
        paragraphs: [
          "Optional frame-reserve modes are limited to zero through three decoded frames. Windows retains fixed IMFSample references, while Linux uses a bounded downstream-leaky GStreamer queue. Teardown and reconnect flush these queues so stale frames from an old generation cannot leak into a replacement session.",
          "Windows also exposes explicit off, automatic, software, and supported hardware-multiple pacing modes. Adaptive late-frame dropping is gated by evidence such as severe lateness, a newer decoded frame, back pressure, cooldown, and smoothing compatibility; it is not enabled on backends that cannot prove a safe drop point.",
        ],
        bullets: [
          "Zero-to-three-frame optional decoded reserve",
          "Oldest-frame overflow policy in bounded queues",
          "Explicit pacing modes instead of hidden timing behavior",
          "Conservative platform gates for adaptive frame dropping",
        ],
      },
      {
        eyebrow: "Remote path",
        heading: "Treat a managed internet path differently from a local LAN",
        paragraphs: [
          "Noland's default managed remote configuration retains Moonlight's WAN behavior and uses a conservative 1024-byte packet size. An optional adaptive controller can choose from a fixed safe ladder using route classification, interface or tunnel MTU hints, aggregate RTP/FEC counters, and RTT variance.",
          "This is not active PMTU discovery and does not send probe packets. Packet size is selected before stream startup and changes only through a controlled reconnect after repeated strong evidence, never by mutating the running protocol in place.",
        ],
        bullets: [
          "Remote-safe default packet size",
          "Fixed candidate ladder from 960 to 1392 bytes",
          "No raw-socket, ICMP, DF-bit, or payload probing",
          "Controlled reconnect rather than in-place protocol mutation",
        ],
      },
      {
        eyebrow: "Recovery and diagnostics",
        heading: "Recover once, then expose enough evidence to debug the path",
        paragraphs: [
          "An unexpected non-zero termination can trigger one immediate, generation-guarded reconnect. A user stop, graceful host termination, replacement stream, or application shutdown clears reconnect intent. This avoids recursive or unbounded retry loops that can fight the user or hide a persistent failure.",
          "Aggregate diagnostics can report stream and display rates, queue depth, decode and render dwell, back pressure, local drop reasons, RTP/FEC deltas, reconnect totals, path classification, MTU hint, and selected packet size. These are measurements and controls—not a guarantee of a particular FPS or end-to-end latency.",
        ],
        links: [
          { href: "/features/display-manager/", label: "Match the remote display to the stream" },
          { href: "/sunshine-moonlight-cloud-gaming/", label: "Learn the Sunshine and Moonlight architecture" },
        ],
      },
    ],
    faqs: [
      {
        question: "Does Noland send video through React or the Tauri webview?",
        answer:
          "No. Native code owns the Moonlight connection, decoding, and presentation. The web interface receives control state and aggregate diagnostics rather than video frames.",
      },
      {
        question: "Are all latency optimizations enabled by default?",
        answer:
          "No. Safety-sensitive features such as adaptive late-frame dropping, adaptive packet sizing, decoder back-pressure policy, pacing, and smoothing reserves use conservative defaults and platform-specific gates.",
      },
      {
        question: "Does adaptive packet sizing discover the real path MTU?",
        answer:
          "No. It uses route classification, operating-system MTU hints, cached choices, and aggregate stream evidence. It does not perform active PMTU probes or change packet size during a running connection.",
      },
      {
        question: "Will the client reconnect forever after a failure?",
        answer:
          "No. Automatic recovery is bounded to one immediate attempt per eligible failure episode and is suppressed for explicit stops, graceful termination, replacement streams, and shutdown.",
      },
    ],
  },
];

export const getFeaturePage = (pathname: string): SeoPage | undefined => {
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return featurePages.find((page) => page.path === normalizedPath);
};

export const isFeaturePage = (page: SeoPage): boolean => page.path.startsWith("/features/");
