export interface SeoLink {
  href: string;
  label: string;
}

export interface SeoSection {
  eyebrow?: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  links?: SeoLink[];
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoPage {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  quickAnswer: string;
  highlights: Array<{ value: string; label: string }>;
  sections: SeoSection[];
  faqs: SeoFaq[];
}

export const seoPages: SeoPage[] = [
  {
    path: "/cloud-gaming-pc/",
    title: "Cloud Gaming PC Rental — Pay by the Hour | Noland",
    description:
      "Build a pay-as-you-go cloud gaming PC on Vast.ai GPU hardware with Noland. Provision a Linux gaming host and stream directly from your desktop.",
    eyebrow: "Cloud gaming PC",
    heading: "Rent a cloud gaming PC by the hour",
    lede:
      "Noland turns marketplace GPU capacity from your Vast.ai account into a Linux gaming environment with the NVIDIA stack, Sunshine, and WireGuard configured for direct streaming.",
    quickAnswer:
      "Noland is a desktop client for creating a pay-as-you-go cloud gaming PC on Vast.ai. You select available GPU hardware, Noland provisions the Linux host in an average of 10–15 minutes, and you stream directly without paying a monthly Noland subscription.",
    highlights: [
      { value: "$0", label: "monthly Noland subscription" },
      { value: "10–15 min", label: "average provisioning time" },
      { value: "~$0.10–$0.40/hr", label: "typical overall compute range" },
    ],
    sections: [
      {
        eyebrow: "How it works",
        heading: "From marketplace GPU to stream-ready Linux host",
        paragraphs: [
          "Connect Noland to your own Vast.ai account and use live marketplace listings to choose the GPU hardware and configuration that fit your game and budget. Noland then provisions a Linux gaming environment and configures the NVIDIA software stack, Sunshine streaming host, and WireGuard networking needed for a direct connection.",
          "Provisioning averages 10–15 minutes, but it is infrastructure setup rather than an instant session. Once the environment is ready, your desktop remains the place where you manage the cloud machine and begin streaming.",
        ],
        bullets: [
          "Choose from currently available Vast.ai GPU listings",
          "Provision the gaming environment from the Noland desktop client",
          "Connect through WireGuard and stream from the Sunshine host",
        ],
        links: [
          { href: "/vast-ai-cloud-gaming/", label: "How Vast.ai cloud gaming works" },
          {
            href: "/sunshine-moonlight-cloud-gaming/",
            label: "Understand the Sunshine and Moonlight setup",
          },
        ],
      },
      {
        eyebrow: "Cost model",
        heading: "Pay for marketplace compute, not a Noland membership",
        paragraphs: [
          "Noland has a $0 monthly subscription. Compute is billed through the marketplace while your instance runs, so cost follows the hardware, host, and live supply you select rather than a fixed gaming plan.",
          "A typical overall compute range is about $0.10–$0.40 per hour, depending on current supply and configuration. That range is a practical reference, not a quote: listings change, availability is not guaranteed, and higher-end or scarce hardware can cost more.",
        ],
        links: [
          {
            href: "/pay-as-you-go-cloud-gaming/",
            label: "Explore pay-as-you-go cloud gaming",
          },
        ],
      },
      {
        eyebrow: "Performance",
        heading: "Direct streaming with latency described honestly",
        paragraphs: [
          "Noland is designed to enable a direct stream between your device and the provisioned host. In measurements, Noland adds about 8 ms of overhead above the natural network-route latency; that is not an 8 ms total-latency promise.",
          "Your actual experience also depends on distance to the host, internet routing, local network quality, encoding and decoding, the selected GPU, game settings, and display. No marketplace configuration can guarantee a particular FPS or end-to-end latency.",
        ],
        bullets: [
          "Prefer hosts with a sensible network route to your location",
          "Use a stable local connection when possible",
          "Match GPU choice and game settings to your performance target",
        ],
      },
      {
        eyebrow: "Fit and limitations",
        heading: "Flexible hardware does not mean every game will work",
        paragraphs: [
          "The provisioned host is Linux, not a Windows VM. Linux support, anti-cheat systems, launchers, DRM, peripherals, and Windows-only features can all affect whether a particular title runs correctly, so check the games that matter to you before choosing this model.",
          "Treat marketplace instances as disposable infrastructure rather than assuming local files will always be available after the instance lifecycle. Use game-supported cloud saves or another appropriate backup approach where available, and stop instances when you are finished to avoid continued compute charges.",
        ],
        links: [
          { href: "/cloud-gaming-mac/", label: "Cloud gaming from a Mac" },
          { href: "/cloud-gaming-low-end-pc/", label: "Cloud gaming on a low-end PC" },
        ],
      },
    ],
    faqs: [
      {
        question: "What is a Noland cloud gaming PC?",
        answer:
          "It is a Linux gaming environment provisioned on GPU hardware selected from the Vast.ai marketplace. Noland configures the host software and networking used for direct streaming, while the user controls the Vast.ai account and marketplace instance.",
      },
      {
        question: "Does Noland charge a monthly cloud gaming fee?",
        answer:
          "No. The Noland subscription price is $0 per month. Vast.ai marketplace compute is billed while the selected instance runs, and the rate depends on the live listing and configuration.",
      },
      {
        question: "How long does it take to create the gaming environment?",
        answer:
          "Average provisioning time is about 10–15 minutes. Actual setup time can vary with the selected host, image and package setup, networking, and marketplace conditions.",
      },
      {
        question: "Is the cloud gaming host Windows?",
        answer:
          "No. Noland provisions a Linux gaming environment. Games that require Windows-only components or incompatible anti-cheat technology may not work.",
      },
      {
        question: "Will every PC game run?",
        answer:
          "No. Compatibility varies by game, launcher, anti-cheat system, Linux support, and required features. Verify your important titles rather than assuming universal compatibility.",
      },
    ],
  },
  {
    path: "/pay-as-you-go-cloud-gaming/",
    title: "Pay-As-You-Go Cloud Gaming Without a Subscription | Noland",
    description:
      "Use Noland for pay-as-you-go cloud gaming on Vast.ai GPUs. Pay marketplace compute while your Linux gaming instance runs, with no monthly Noland fee.",
    eyebrow: "Usage-based cloud gaming",
    heading: "Pay-as-you-go cloud gaming with no monthly Noland fee",
    lede:
      "Choose live GPU marketplace hardware through your Vast.ai account, run it when you want to play, and pay the compute rate associated with that instance while it is running.",
    quickAnswer:
      "Noland has no monthly subscription. Instead, you pay Vast.ai marketplace compute while your selected Linux gaming instance runs; typical overall compute is about $0.10–$0.40 per hour, but current supply and configuration determine the actual rate.",
    highlights: [
      { value: "$0/mo", label: "Noland subscription" },
      { value: "Per hour", label: "marketplace compute model" },
      { value: "Live supply", label: "determines choice and pricing" },
    ],
    sections: [
      {
        eyebrow: "Pricing",
        heading: "What you pay for",
        paragraphs: [
          "The Noland desktop client does not add a monthly subscription. Your usage cost comes from the Vast.ai marketplace instance you choose, and compute continues to be billed while that instance is running.",
          "Typical overall compute falls around $0.10–$0.40 per hour for many practical configurations. It can be lower or higher because GPU model, host configuration, demand, and available inventory change over time; Noland does not guarantee a particular listing or price.",
        ],
        bullets: [
          "$0 monthly Noland subscription",
          "Marketplace rate shown for the hardware you select",
          "Compute charges accrue while the instance runs",
        ],
        links: [
          { href: "/vast-ai-cloud-gaming/", label: "Learn about the Vast.ai marketplace model" },
        ],
      },
      {
        eyebrow: "Planning",
        heading: "Estimate a session before starting it",
        paragraphs: [
          "A simple planning estimate is the listing's hourly compute rate multiplied by the time you expect the instance to run. Include provisioning and any installation or setup time in your usage plan, not only active gameplay.",
          "Provisioning averages 10–15 minutes, and downloading games can add more time. Stop the instance when you are done, and confirm its state in the service you use for billing rather than assuming closing a stream has ended compute usage.",
        ],
        bullets: [
          "Review the selected listing and configuration before provisioning",
          "Allow time for setup and game downloads",
          "Verify the instance is stopped after each session",
        ],
      },
      {
        eyebrow: "Tradeoffs",
        heading: "Usage pricing exchanges predictability for choice",
        paragraphs: [
          "A GPU marketplace can offer a broad range of hardware without putting everyone on the same fixed tier. That makes it possible to choose around your workload, but the exact GPU, location, and rate you want may not be available every time.",
          "The best value is not automatically the cheapest listing. Network route, host reliability, GPU capability, and the configuration required by your game all matter, so compare the complete fit rather than optimizing for hourly price alone.",
        ],
        links: [
          { href: "/cloud-gaming-pc/", label: "See the complete cloud gaming PC workflow" },
          { href: "/cloud-gaming-low-end-pc/", label: "Stream from a lower-spec PC" },
        ],
      },
      {
        eyebrow: "Before you choose",
        heading: "Know the platform and game limitations",
        paragraphs: [
          "Noland provisions a Linux gaming environment. Compatibility varies, especially for games with unsupported anti-cheat, launchers, or Windows-only features, and not every title will run even when the selected GPU is powerful enough.",
          "Performance is also variable. Marketplace hardware, geographic distance, internet routing, local network conditions, and stream settings prevent responsible guarantees about FPS or latency; the measured Noland overhead of about 8 ms sits above natural route latency rather than replacing it.",
        ],
        links: [
          {
            href: "/sunshine-moonlight-cloud-gaming/",
            label: "Read about the direct streaming path",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is Noland really subscription-free?",
        answer:
          "Yes. Noland's monthly subscription price is $0. You still pay the Vast.ai marketplace compute charges associated with your selected instance while it runs.",
      },
      {
        question: "How much does pay-as-you-go cloud gaming cost per hour?",
        answer:
          "Typical overall compute is about $0.10–$0.40 per hour, depending on live marketplace supply and configuration. It is not a guaranteed range, and the actual listing you choose may cost less or more.",
      },
      {
        question: "Am I charged only while playing a game?",
        answer:
          "Compute billing is tied to the marketplace instance running, not to whether a game is actively on screen. Provisioning, setup, downloads, and idle time can therefore be part of billed runtime.",
      },
      {
        question: "Does closing the stream stop compute billing?",
        answer:
          "Do not assume it does. Stop the marketplace instance when you are finished and verify its state so that it does not continue running unintentionally.",
      },
      {
        question: "Are GPU prices and availability fixed?",
        answer:
          "No. Vast.ai is a live marketplace, so hardware supply, host location, configuration, and pricing can change. A specific GPU or rate may not be available when you next start a session.",
      },
    ],
  },
  {
    path: "/cloud-gaming-mac/",
    title: "Cloud Gaming on Mac with Marketplace GPUs | Noland",
    description:
      "Run Noland on macOS to provision a Linux gaming host on Vast.ai GPU hardware, then stream directly to your Mac with usage-based compute pricing.",
    eyebrow: "Cloud gaming for macOS",
    heading: "Cloud gaming on Mac using a remote marketplace GPU",
    lede:
      "Use the Noland desktop client on macOS to choose Vast.ai GPU hardware, provision a remote Linux gaming environment, and stream games to your Mac over a direct connection.",
    quickAnswer:
      "Noland lets a Mac act as the streaming client for a Linux gaming host on a Vast.ai GPU. It can move rendering away from the Mac, but it does not turn the host into Windows or make every Windows game compatible.",
    highlights: [
      { value: "macOS", label: "native desktop client platform" },
      { value: "Remote GPU", label: "handles game rendering" },
      { value: "$0/mo", label: "Noland subscription" },
    ],
    sections: [
      {
        eyebrow: "Workflow",
        heading: "Use your Mac to manage and access the gaming host",
        paragraphs: [
          "From Noland on macOS, connect your Vast.ai account, inspect available marketplace hardware, and choose an instance suited to your budget and game. Noland provisions the remote Linux environment with NVIDIA components, Sunshine, and WireGuard; average provisioning takes about 10–15 minutes.",
          "The remote GPU renders the game and encodes the stream while your Mac displays and controls the session. This can bypass the Mac's local graphics limitations for supported games, but stream quality still depends on both ends of the connection.",
        ],
        links: [
          { href: "/cloud-gaming-pc/", label: "See how the cloud gaming PC is built" },
          {
            href: "/sunshine-moonlight-cloud-gaming/",
            label: "Learn about Sunshine and Moonlight streaming",
          },
        ],
      },
      {
        eyebrow: "Compatibility",
        heading: "The client is macOS; the gaming host is Linux",
        paragraphs: [
          "Noland supports a macOS desktop client, but the provisioned cloud machine is a Linux gaming environment, not a Windows VM. A title's macOS support is not the deciding factor for the remote host; its Linux, launcher, and anti-cheat compatibility are what matter.",
          "Some games work well in Linux gaming environments and others do not. Windows-only platform features, restrictive anti-cheat, DRM, input requirements, or launcher behavior can prevent a game from working, so verify important titles individually.",
        ],
        bullets: [
          "Do not assume a Windows-only game will run",
          "Check anti-cheat and launcher requirements",
          "Confirm your controllers and other input needs are supported by the streaming setup",
        ],
      },
      {
        eyebrow: "Network experience",
        heading: "Your route to the selected host matters",
        paragraphs: [
          "Noland enables direct streaming through the provisioned Sunshine and WireGuard setup. Measured Noland overhead is about 8 ms above the natural route latency, not 8 ms total latency from the host to your Mac.",
          "Physical distance, ISP routing, Wi-Fi quality, congestion, video decoding, resolution, and frame-rate settings all contribute to the result. Choose a sensible host location and use a stable local network, but do not expect a guaranteed latency or FPS figure.",
        ],
      },
      {
        eyebrow: "Costs and operations",
        heading: "Run the GPU when you need it",
        paragraphs: [
          "Noland costs $0 per month, while Vast.ai marketplace compute is billed for the time your instance runs. Typical overall compute is about $0.10–$0.40 per hour, although live supply and the selected hardware can move the actual price outside that range.",
          "Allow for provisioning, installation, and download time in your session cost. Stop the instance and verify its status when finished, and treat the environment as disposable by relying on game-supported cloud saves or another suitable backup method where available.",
        ],
        links: [
          {
            href: "/pay-as-you-go-cloud-gaming/",
            label: "Understand usage-based cloud gaming costs",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Can I use Noland for cloud gaming on a Mac?",
        answer:
          "Yes. Noland provides a macOS desktop client that can provision and connect to a remote Linux gaming environment running on selected Vast.ai GPU hardware.",
      },
      {
        question: "Does the cloud GPU make Windows games compatible with macOS?",
        answer:
          "Not automatically. The remote host is Linux, not Windows. Compatibility depends on the game, its Linux behavior, launcher, anti-cheat, DRM, and required features.",
      },
      {
        question: "Does my Mac need a powerful GPU?",
        answer:
          "The remote GPU performs the game rendering, so the Mac does not need to render the game locally. It still needs to run the client, decode the video stream, handle input, and maintain a stable network connection.",
      },
      {
        question: "How much does Noland cloud gaming on Mac cost?",
        answer:
          "Noland has no monthly subscription. Typical overall marketplace compute is about $0.10–$0.40 per hour, but actual rates vary with current GPU supply, host, and configuration.",
      },
      {
        question: "What latency should I expect on Mac?",
        answer:
          "There is no universal latency figure. Noland's measured overhead is about 8 ms above natural route latency, while total latency also includes the network route, local connection, encoding, decoding, display, and input path.",
      },
    ],
  },
  {
    path: "/cloud-gaming-low-end-pc/",
    title: "Cloud Gaming for a Low-End PC with a Remote GPU | Noland",
    description:
      "Use a low-end PC as a streaming client while a selected Vast.ai GPU renders supported games in Noland's remote Linux gaming environment.",
    eyebrow: "Cloud gaming for lower-spec hardware",
    heading: "Use a low-end PC to stream from a remote marketplace GPU",
    lede:
      "Noland moves game rendering to a GPU instance selected through your Vast.ai account, letting a Windows, macOS, or Linux desktop receive the stream instead of doing the heavy rendering locally.",
    quickAnswer:
      "Cloud gaming can let a lower-spec PC play supported games by rendering them on a remote GPU and streaming the result. The local computer still needs reliable networking, video decoding, and input support, and Noland cannot make every game or device compatible.",
    highlights: [
      { value: "3 clients", label: "Windows, macOS, and Linux" },
      { value: "Remote", label: "GPU rendering workload" },
      { value: "Direct", label: "stream from the provisioned host" },
    ],
    sections: [
      {
        eyebrow: "What moves to the cloud",
        heading: "Let the remote GPU handle rendering",
        paragraphs: [
          "Noland provisions a Linux gaming environment on marketplace GPU hardware, where the game rendering and stream encoding take place. Your local Windows, macOS, or Linux desktop receives the video stream and sends controls back to the host.",
          "This model can reduce the local graphics workload, but it does not remove every local requirement. The PC must still run the desktop and streaming software, decode the chosen video settings smoothly, support your input devices, and stay connected to the host.",
        ],
        links: [
          { href: "/cloud-gaming-pc/", label: "Learn about the remote cloud gaming PC" },
        ],
      },
      {
        eyebrow: "Local checklist",
        heading: "Network and decoding matter more than gaming horsepower",
        paragraphs: [
          "A stable network is essential because every frame and input crosses the connection. Wired networking can help where practical, while Wi-Fi quality, competing traffic, ISP routing, and distance to the host can all affect responsiveness and image stability.",
          "Older devices can also struggle with high-resolution or high-frame-rate video decoding. Start with conservative stream settings and adjust based on what your machine and connection can sustain; no specific resolution, FPS, or latency is guaranteed.",
        ],
        bullets: [
          "Use a stable local network connection",
          "Choose stream settings the local device can decode",
          "Confirm controllers, audio, and display behavior before a long session",
        ],
        links: [
          {
            href: "/sunshine-moonlight-cloud-gaming/",
            label: "See how the streaming stack fits together",
          },
        ],
      },
      {
        eyebrow: "Choosing a host",
        heading: "Balance GPU capability, route, and hourly rate",
        paragraphs: [
          "The most powerful available GPU is not necessarily the best match for a low-end client. Select enough remote performance for the game and stream target, then consider the host's location and likely network route alongside its price.",
          "Marketplace inventory and rates change. Typical overall compute is about $0.10–$0.40 per hour depending on current supply and configuration, but no particular GPU, location, price, or level of performance is guaranteed.",
        ],
        links: [
          { href: "/vast-ai-cloud-gaming/", label: "Choose Vast.ai hardware for cloud gaming" },
          {
            href: "/pay-as-you-go-cloud-gaming/",
            label: "Review pay-as-you-go pricing",
          },
        ],
      },
      {
        eyebrow: "Limits",
        heading: "Remote power cannot solve software incompatibility",
        paragraphs: [
          "Noland's host is a Linux gaming environment. A faster GPU does not fix an unsupported anti-cheat system, a Windows-only feature, an incompatible launcher, DRM restrictions, or game-specific Linux problems, and not every game will work.",
          "Provisioning averages 10–15 minutes and game installation may take longer, so this is not an instant catalog. Treat instances as disposable, protect saves through game-supported cloud sync or another appropriate method where available, and verify the instance is stopped when finished.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can cloud gaming work on a low-end PC?",
        answer:
          "It can when the PC is able to run the client, decode the video stream, handle input, and maintain a stable connection. The selected remote GPU performs the demanding game rendering.",
      },
      {
        question: "Which desktop operating systems does Noland support?",
        answer:
          "Noland provides desktop clients for Windows, macOS, and Linux. The remote gaming environment it provisions is Linux regardless of the local client platform.",
      },
      {
        question: "Will cloud gaming increase my local PC's FPS?",
        answer:
          "The game runs on the remote GPU, so its rendering performance is based primarily on that host and its configuration. What you see locally also depends on stream settings, decoding, networking, and the display, so a particular FPS is not guaranteed.",
      },
      {
        question: "How fast does my internet need to be?",
        answer:
          "There is no single requirement that guarantees a good result. Resolution, frame rate, codec behavior, network stability, congestion, routing, and host distance all matter; stable connectivity is as important as headline bandwidth.",
      },
      {
        question: "Can a low-end PC stream every game through Noland?",
        answer:
          "No. Local decoding is only one part of compatibility. The remote Linux environment must also support the game, launcher, anti-cheat, DRM, and required features.",
      },
    ],
  },
  {
    path: "/vast-ai-cloud-gaming/",
    title: "Vast.ai Cloud Gaming Setup with Noland",
    description:
      "Use your Vast.ai account and API key with Noland to choose marketplace GPUs, provision a Linux gaming environment, and stream through Sunshine and WireGuard.",
    eyebrow: "Vast.ai cloud gaming",
    heading: "Turn Vast.ai GPU listings into a cloud gaming setup",
    lede:
      "Noland handles the gaming-focused provisioning between your Vast.ai marketplace choice and a stream-ready Linux host, while you retain control of the account, hardware selection, and compute spend.",
    quickAnswer:
      "Noland uses your Vast.ai account and API key to let you select marketplace GPU hardware, then provisions a Linux gaming environment with the NVIDIA stack, Sunshine, and WireGuard. Compute is billed through Vast.ai while the instance runs; Noland has no monthly subscription.",
    highlights: [
      { value: "Your account", label: "Vast.ai marketplace access" },
      { value: "Your choice", label: "available GPU listing" },
      { value: "Automated", label: "gaming environment provisioning" },
    ],
    sections: [
      {
        eyebrow: "Noland's role",
        heading: "Bridge marketplace infrastructure and game streaming",
        paragraphs: [
          "Raw GPU capacity is only one part of a cloud gaming machine. Noland uses the marketplace selection from your Vast.ai account and provisions the Linux environment, NVIDIA stack, Sunshine host, and WireGuard networking needed to prepare it for direct streaming.",
          "Average provisioning time is 10–15 minutes. That automation reduces manual infrastructure setup, but game installation, account sign-in, and title-specific configuration can still take additional time.",
        ],
        links: [
          { href: "/cloud-gaming-pc/", label: "Explore the complete cloud gaming PC experience" },
          {
            href: "/sunshine-moonlight-cloud-gaming/",
            label: "Understand Sunshine and WireGuard streaming",
          },
        ],
      },
      {
        eyebrow: "Marketplace selection",
        heading: "Choose from what is available now",
        paragraphs: [
          "Vast.ai supply is a live marketplace rather than a fixed hardware catalog. GPU models, host locations, configurations, and prices can change, and the listing you used previously may not be available for the next session.",
          "Evaluate more than the GPU name. The hardware configuration must suit the game, while host location and network route influence streaming responsiveness; price, capacity, and proximity need to be considered together.",
        ],
        bullets: [
          "Check the current hourly rate and configuration",
          "Consider host location and expected network route",
          "Select enough GPU capacity for your game and stream settings",
        ],
      },
      {
        eyebrow: "Billing",
        heading: "Understand when marketplace compute costs accrue",
        paragraphs: [
          "Noland's monthly subscription is $0. The Vast.ai account is responsible for marketplace compute charges while the selected instance runs, including time spent provisioning, installing, downloading, or sitting idle.",
          "Typical overall compute is around $0.10–$0.40 per hour, but this is not guaranteed pricing. Live supply and the chosen configuration determine the actual rate, so review the listing before launch and verify that the instance is stopped after use.",
        ],
        links: [
          {
            href: "/pay-as-you-go-cloud-gaming/",
            label: "Plan pay-as-you-go cloud gaming costs",
          },
        ],
      },
      {
        eyebrow: "Technical reality",
        heading: "A Linux gaming host with variable compatibility",
        paragraphs: [
          "Noland provisions Linux, not a Windows VM. Game compatibility depends on Linux support, launchers, anti-cheat, DRM, and required Windows-only features, which means access to a suitable GPU does not guarantee that a particular game will run.",
          "Streaming results vary too. Noland's measured overhead is about 8 ms above natural route latency, while total latency also includes routing, local networking, encoding, decoding, input, and display; no host can be selected with a guaranteed FPS or end-to-end latency.",
        ],
      },
      {
        eyebrow: "Good operating habits",
        heading: "Treat each marketplace instance as replaceable",
        paragraphs: [
          "Use game-supported cloud saves or another suitable backup workflow where available instead of assuming files will remain available beyond an instance's lifecycle. Keep account credentials and API access under your control, and remove access you no longer intend to use.",
          "Before ending a session, close the game cleanly, allow any supported save synchronization to complete, stop the marketplace instance, and confirm its status. These steps help protect progress and prevent unintended runtime charges.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does Noland add to Vast.ai for cloud gaming?",
        answer:
          "Noland provides a desktop workflow for choosing marketplace hardware and automates a gaming-focused Linux setup with NVIDIA components, Sunshine, and WireGuard. Vast.ai provides the marketplace compute and bills the running instance.",
      },
      {
        question: "Do I need my own Vast.ai account and API key?",
        answer:
          "Yes. Noland uses the user's Vast.ai account and API key so the user can choose marketplace hardware and provision the instance associated with that account.",
      },
      {
        question: "How much does a Vast.ai gaming instance cost?",
        answer:
          "Typical overall compute is about $0.10–$0.40 per hour, depending on live supply and configuration. Actual marketplace prices vary, and neither a specific rate nor a specific GPU is guaranteed.",
      },
      {
        question: "Is the Vast.ai gaming machine a Windows VM?",
        answer:
          "No. Noland provisions a Linux gaming environment. Titles that depend on unsupported anti-cheat or Windows-only features may not work.",
      },
      {
        question: "Does deleting or stopping an instance preserve my games and saves?",
        answer:
          "Do not assume local instance data will remain available across the instance lifecycle. Use game-supported cloud saves or another appropriate backup approach where available before stopping or replacing infrastructure.",
      },
      {
        question: "Can I get the same GPU every time?",
        answer:
          "Not necessarily. Vast.ai inventory is supplied through a live marketplace, so hardware, location, configuration, and pricing can change between sessions.",
      },
    ],
  },
  {
    path: "/sunshine-moonlight-cloud-gaming/",
    title: "Sunshine and Moonlight Cloud Gaming Setup | Noland",
    description:
      "Noland provisions Sunshine and WireGuard on a Vast.ai Linux GPU host for direct cloud game streaming to a Moonlight-compatible client workflow.",
    eyebrow: "Direct game streaming",
    heading: "Sunshine and Moonlight cloud gaming on a provisioned GPU host",
    lede:
      "Noland prepares the remote Linux gaming environment and Sunshine host, connects it through WireGuard, and enables a direct streaming path for a Moonlight-compatible client workflow.",
    quickAnswer:
      "Sunshine runs on the provisioned Vast.ai GPU host to capture and encode the game stream, while a Moonlight-compatible client receives video and sends input. Noland automates the surrounding Linux, NVIDIA, and WireGuard setup rather than promising a fixed latency or compatibility result.",
    highlights: [
      { value: "Sunshine", label: "streaming host" },
      { value: "WireGuard", label: "network connection" },
      { value: "~8 ms", label: "measured Noland overhead above route latency" },
    ],
    sections: [
      {
        eyebrow: "Architecture",
        heading: "How the host and client divide the work",
        paragraphs: [
          "The Vast.ai GPU host runs the Linux gaming environment and Sunshine, which captures rendered frames and encodes them for streaming. The client side receives and decodes that video, plays audio, and returns keyboard, mouse, or controller input to the remote session.",
          "Noland configures the NVIDIA stack, Sunshine, and WireGuard as part of provisioning, which averages 10–15 minutes. Games and their launchers can require additional installation and configuration after the base environment is ready.",
        ],
        links: [
          { href: "/vast-ai-cloud-gaming/", label: "See how the Vast.ai host is provisioned" },
          { href: "/cloud-gaming-pc/", label: "Explore the cloud gaming PC workflow" },
        ],
      },
      {
        eyebrow: "Connection model",
        heading: "A direct stream still follows the real network route",
        paragraphs: [
          "WireGuard provides the network connection used to reach the Sunshine host, allowing the stream to travel directly between the client and provisioned environment rather than through a Noland video relay. Direct does not mean distance-free: packets still follow the available internet route.",
          "Noland's measured overhead is about 8 ms above natural route latency. This is not total input-to-display latency, which also includes routing, game processing, encoding, local and remote network conditions, decoding, display, and input devices.",
        ],
        bullets: [
          "Select a host with a sensible route to your location",
          "Prefer a stable local connection",
          "Tune bitrate, resolution, and frame rate for the actual network and client",
        ],
      },
      {
        eyebrow: "Quality",
        heading: "GPU choice is only one performance variable",
        paragraphs: [
          "The selected GPU affects game rendering and encoding headroom, but stream quality also depends on the host configuration, game settings, client decoding capability, bandwidth stability, congestion, and display. A higher-priced GPU cannot correct a poor network route.",
          "There is no responsible guarantee for FPS, resolution, or latency across every setup. Start with settings the client and connection can sustain, observe the session, and adjust before increasing quality targets.",
        ],
        links: [
          {
            href: "/cloud-gaming-low-end-pc/",
            label: "Prepare a lower-spec streaming client",
          },
          { href: "/cloud-gaming-mac/", label: "Use the streaming setup from a Mac" },
        ],
      },
      {
        eyebrow: "Compatibility",
        heading: "Streaming support and game support are separate questions",
        paragraphs: [
          "A working Sunshine stream does not guarantee that a game itself will run. Noland's remote environment is Linux, and compatibility varies with the title, launcher, anti-cheat, DRM, Windows-only features, and input requirements.",
          "Not every game works, and marketplace hardware and pricing are not guaranteed. Treat the host as disposable, use supported save synchronization or another appropriate backup approach where available, and stop the instance when the session ends to avoid continued compute billing.",
        ],
        links: [
          {
            href: "/pay-as-you-go-cloud-gaming/",
            label: "Understand billing while the streaming host runs",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "What are Sunshine and Moonlight in cloud gaming?",
        answer:
          "Sunshine is the streaming host running with the remote game environment. A Moonlight-compatible client receives the encoded video and audio and sends player input back to that host.",
      },
      {
        question: "What does Noland configure for the stream?",
        answer:
          "Noland provisions the Linux gaming environment with the NVIDIA stack, Sunshine, and WireGuard on the selected Vast.ai GPU hardware, enabling the client to connect to the prepared host.",
      },
      {
        question: "Does direct streaming mean 8 ms total latency?",
        answer:
          "No. About 8 ms is the measured Noland overhead above natural route latency. Total latency also includes the internet route, game processing, encoding, decoding, local networking, input, and display.",
      },
      {
        question: "Does Sunshine make every game work on the host?",
        answer:
          "No. Sunshine handles streaming, not game compatibility. The Linux host may still be incompatible with a game's anti-cheat, launcher, DRM, Windows-only features, or other requirements.",
      },
      {
        question: "Can I use this setup from Windows, macOS, or Linux?",
        answer:
          "Noland has desktop clients for Windows, macOS, and Linux. Client performance and peripheral support still depend on the local device, operating system, decoding capability, and streaming configuration.",
      },
      {
        question: "How much does the Sunshine cloud host cost?",
        answer:
          "Noland has a $0 monthly subscription. Vast.ai compute is billed while the selected instance runs, with typical overall compute around $0.10–$0.40 per hour depending on live supply and configuration; actual rates can vary.",
      },
    ],
  },
];

export const getSeoPage = (pathname: string): SeoPage | undefined => {
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;

  return seoPages.find((page) => page.path === normalizedPath);
};
