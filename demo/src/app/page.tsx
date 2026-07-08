import Image from 'next/image'

import { AnnouncementBadge } from '@/components/elements/announcement-badge'
import { ButtonLink, PlainButtonLink } from '@/components/elements/button'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { HeroLeftAlignedWithDemo } from '@/components/sections/hero-left-aligned-with-demo'
import { SeCaseStudies, type SeCaseStudy } from '../components/sections/se-casestudies'
import { SeStatsCard } from '@/components/sections/se-stats-card'
import { Testimonial, TestimonialThreeColumnGrid } from '@/components/sections/testimonials-three-column-grid'

const stats = [
  {
    id: 1,
    name: 'Revenue & partnership commitments influenced',
    value: '$17M+',
  },
  {
    id: 2,
    name: 'Enterprise accounts & F500 engagements supported',
    value: '40+',
  },
  {
    id: 3,
    name: 'Sales / ops hours saved per quarter',
    value: '60+',
  },
  {
    id: 4,
    name: 'Manual reporting effort reduced',
    value: '70%',
  },
]

const caseStudies: SeCaseStudy[] = [
  {
    id: 11,
    company: 'Gladly',
    role: 'Enterprise Solutions Engineer',
    location: 'Remote',
    industry: 'SAAS-AI',
    imageSrc: '/img/logos/GLADLY-CARD.png',
    category: 'professional',
    impact_summary:
      'Built enterprise CX solution narratives around AI, automation, API connectivity, and customer support operations. Partnered with sales and technical stakeholders to shape custom demos, integration workflows, and business value cases for complex customer experience teams.',
    technologies: [
      'Customer Experience AI',
      'Support Automation',
      'REST APIs',
      'Postman',
      'JavaScript',
      'Node.js',
      'React',
      'Python',
      'Integrations',
      'POCs',
      'Solution Architecture',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Customer experience AI platform focused on support automation, continuous customer conversations, agent workflows, and enterprise CX operations.',
        market_icp:
          'Enterprise support, customer experience, and operations leaders evaluating AI, CCaaS, support automation, and API-enabled customer service platforms.',
        deal_stage:
          'Enterprise discovery, technical validation, custom demo, proof-of-concept, competitive evaluation, and post-sale handoff support.',
      },
      problem: {
        buyer_struggles:
          'Support leaders needed to reduce cost without creating a poor customer experience. Technical buyers needed confidence that AI workflows, support operations, and API integrations could fit into their existing stack.',
        common_objections:
          'Concerns included AI accuracy, implementation complexity, integration risk, incumbent platform displacement, support team adoption, and whether automation would improve loyalty instead of simply deflecting customers.',
      },
      strategy: {
        positioning_decisions:
          'Positioned the platform around customer devotion, not deflection — balancing cost savings with high-quality support experiences and operational scalability.',
        messaging_angle:
          'Translated technical capabilities into executive-level value: faster response times, better customer context, lower repetitive support volume, and cleaner handoffs between AI and human agents.',
        channel_selection:
          'Used AE-led discovery, technical workshops, custom demos, API walkthroughs, POC environments, and cross-functional implementation planning.',
      },
      execution: {
        outreach_approach:
          'Partnered with Account Executives to align technical discovery to business priorities across CX, operations, product, and technical stakeholders.',
        demo_or_call_flow:
          'Led demos around AI-assisted support workflows, customer conversation history, automation triggers, API connectivity, and operational reporting.',
        follow_ups:
          'Documented integration requirements, scoped POC next steps, clarified technical risks, and coordinated with Product, Engineering, and Implementation teams for clean handoffs.',
      },
      results: {
        conversion_rate:
          'Supported enterprise evaluation motion by improving technical confidence across CX, executive, and technical buyer groups.',
        pipeline_created:
          'Contributed to enterprise sales opportunities requiring AI, API, and customer experience transformation narratives.',
        deals_closed:
          'Supported deal strategy for high-value enterprise opportunities through technical validation, demo strategy, and solution design.',
        time_to_close:
          'Improved buyer clarity during complex evaluations by converting broad CX goals into scoped technical workflows and measurable business value.',
      },
      learnings: {
        what_worked:
          'The strongest narrative was not “AI replaces support,” but “AI improves support quality while reducing operational friction.”',
        what_id_do_differently:
          'Create more reusable demo templates by vertical, including retail, travel, marketplace, and high-volume support use cases.',
      },
    },
  },

  {
    id: 10,
    company: 'Uprighted',
    role: 'Teaching Assistant',
    location: 'Remote',
    industry: 'Data Science',
    imageSrc: '/img/logos/UPRIGHTED-CARD.png',
    category: 'volunteer',
    impact_summary:
      'Supported technical learning and early-stage civic technology workflows by helping students and builders understand Python, SQL, APIs, and full-stack product concepts. Helped translate engineering concepts into practical implementation steps for non-traditional technical learners.',
    technologies: [
      'Python',
      'SQL',
      'APIs',
      'Technical Instruction',
      'Technical Mentorship',
      'Curriculum Support',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Technical education and civic technology support focused on helping learners build practical software, API, and data skills.',
        market_icp:
          'Early-career developers, civic technology learners, and non-traditional technical students building confidence in software and data workflows.',
        deal_stage:
          'Instructional support, technical enablement, project troubleshooting, and learner onboarding.',
      },
      problem: {
        buyer_struggles:
          'Learners often understood high-level product goals but needed help translating concepts into working code, data models, and API-driven workflows.',
        common_objections:
          'Common blockers included fear of technical complexity, debugging frustration, unclear project structure, and difficulty connecting frontend, backend, and database concepts.',
      },
      strategy: {
        positioning_decisions:
          'Positioned technical learning around business outcomes and product use cases rather than abstract syntax alone.',
        messaging_angle:
          'Made technical concepts easier to understand by connecting Python, SQL, and APIs to real-world workflows like onboarding, engagement, and reporting.',
        channel_selection:
          'Used remote instruction, project reviews, office-hour support, and hands-on debugging sessions.',
      },
      execution: {
        outreach_approach:
          'Supported learners through direct technical guidance, project walkthroughs, and structured debugging conversations.',
        demo_or_call_flow:
          'Explained technical flows from user action to frontend component, API request, backend logic, database query, and response handling.',
        follow_ups:
          'Reinforced lessons with implementation steps, reusable explanations, and simplified examples learners could apply independently.',
      },
      results: {
        conversion_rate:
          'Improved learner confidence by breaking technical concepts into repeatable, product-oriented workflows.',
        pipeline_created:
          'Helped learners advance from concept-level understanding to working technical project execution.',
        deals_closed:
          'Contributed to stronger project completion and better technical fluency across student workstreams.',
        time_to_close:
          'Reduced time spent stuck on implementation issues by providing clear debugging paths and technical framing.',
      },
      learnings: {
        what_worked:
          'Students learned faster when technical concepts were tied to product outcomes and real-world use cases.',
        what_id_do_differently:
          'Create more reusable starter templates for common full-stack workflows, including API calls, SQL queries, and frontend state handling.',
      },
    },
  },

  {
    id: 1,
    company: 'Snowflake',
    role: 'Solutions Engineer - Enterprise',
    location: 'Remote',
    industry: 'SaaS-Monetization',
    imageSrc: '/img/logos/SNOWFLAKE-CARD.png',
    category: 'professional',
    impact_summary:
      'Architected enterprise data clean room and Cortex AI solutions for Fortune 500 clients. Built reusable ML templates, delivered executive workshops, and supported +$7M in partnership commitments through technical sales engagements, API workflows, and data engineering solution design.',
    technologies: [
      'Snowflake',
      'Snowflake DCR',
      'Cortex ML',
      'Streamlit',
      'OpenAI',
      'SQL',
      'Python',
      'Developer APIs',
      'UDFs',
      'ETLs',
      'GCP',
      'AWS',
      'Docker',
      'PySpark',
      'Solution Architecture',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Snowflake data clean rooms, Cortex ML, Streamlit applications, secure data collaboration workflows, and privacy-safe enterprise analytics.',
        market_icp:
          'Fortune 500 data, marketing, analytics, healthcare, retail, media, and financial services teams evaluating secure collaboration, AI analytics, and data monetization workflows.',
        deal_stage:
          'Enterprise discovery, technical workshops, architecture reviews, proof-of-concept design, API walkthroughs, and executive buy-in.',
      },
      problem: {
        buyer_struggles:
          'Enterprise buyers needed to collaborate on sensitive data without exposing raw customer-level records. Business teams also needed faster access to advanced analytics without waiting on engineering queues.',
        common_objections:
          'Concerns included security model clarity, governance, clean room usability, API complexity, implementation timeline, and whether business users could adopt the workflows without heavy engineering support.',
      },
      strategy: {
        positioning_decisions:
          'Positioned Snowflake as the secure collaboration layer for privacy-safe analytics, AI workflows, and enterprise data monetization.',
        messaging_angle:
          'Connected technical architecture to business value: faster analysis, safer collaboration, reduced engineering dependency, and scalable clean room adoption.',
        channel_selection:
          'Used executive workshops, technical deep dives, Streamlit prototypes, SQL/Python workflows, and API-based demonstrations.',
      },
      execution: {
        outreach_approach:
          'Partnered with customers to assess requirements, map data collaboration use cases, and identify high-value workflows for clean room adoption.',
        demo_or_call_flow:
          'Demonstrated DCR architecture, security controls, API integrations, Cortex ML templates, and business-user-facing Streamlit applications.',
        follow_ups:
          'Created reusable technical documentation, clarified architecture tradeoffs, and coordinated with product and data teams on implementation paths.',
      },
      results: {
        conversion_rate:
          'Influenced +10 executive buy-ins and technical adoptions by presenting Snowflake DCR vision and developer API workflows.',
        pipeline_created:
          'Enabled +$7M in partnership commitments through tailored technical solutions for Fortune 500 customers.',
        deals_closed:
          'Supported enterprise technical validation across data clean room and AI analytics opportunities.',
        time_to_close:
          'Reduced analytics turnaround from 3 days to 4 hours through reusable Cortex ML templates embedded in Streamlit apps.',
      },
      learnings: {
        what_worked:
          'The highest-impact demos translated clean room architecture into a business workflow executives could understand immediately.',
        what_id_do_differently:
          'Build more industry-specific demo kits earlier, especially for retail media, healthcare measurement, and financial services collaboration.',
      },
    },
  },

  {
    id: 2,
    company: 'MiQ',
    role: 'Solutions Engineer - Enterprise',
    location: 'Remote',
    industry: 'AdTech',
    imageSrc: '/img/logos/MIQ-CARD.png',
    category: 'professional',
    impact_summary:
      'Built AI and data engineering solutions across healthcare, political analytics, and enterprise media use cases. Delivered an LLM-powered support assistant reducing ticket resolution time by 35%, enabled 40% inquiry deflection, and supported +$5M in partnership commitments through Databricks, React, and AWS solution design.',
    technologies: [
      'Databricks',
      'PrivateGPT',
      'LLMs',
      'React',
      'AWS',
      'GCP',
      'Docker',
      'PySpark',
      'SQL',
      'YAML',
      'APIs',
      'ETLs',
      'UDFs',
      'Looker',
      'Data Partnerships',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Enterprise analytics, healthcare measurement, political analytics, media intelligence, LLM-powered support automation, and custom data workflows.',
        market_icp:
          'Healthcare, political, media, and enterprise analytics teams requiring custom measurement, audience insights, and data activation workflows.',
        deal_stage:
          'Pre-sales discovery, RFP response, solution design, web application development, partner coordination, and post-sale technical support.',
      },
      problem: {
        buyer_struggles:
          'Clients needed custom analytics and measurement solutions but lacked fast access to engineering resources and unified data workflows across multiple partner ecosystems.',
        common_objections:
          'Concerns included data quality, measurement methodology, partner integration complexity, speed of delivery, and whether non-technical teams could self-serve insights.',
      },
      strategy: {
        positioning_decisions:
          'Positioned MiQ as a technical analytics partner capable of building custom enterprise workflows, not just selling media or reporting services.',
        messaging_angle:
          'Focused on measurable outcomes: faster support resolution, fewer repetitive inquiries, reduced engineering dependency, and scalable healthcare and political analytics workflows.',
        channel_selection:
          'Used RFPs, technical case studies, stakeholder workshops, Databricks prototypes, React web applications, and partner-led solutioning.',
      },
      execution: {
        outreach_approach:
          'Worked with sales, engineering, data science, and partner teams to gather requirements and translate them into scoped technical solutions.',
        demo_or_call_flow:
          'Demonstrated analytics workflows, LLM support automation, Databricks-backed applications, and client-specific measurement use cases.',
        follow_ups:
          'Created technical documentation, supported RFP responses, refined customer requirements, and coordinated with data partners including Google, Experian, PurpleLab, and LiveRamp.',
      },
      results: {
        conversion_rate:
          'Deflected 40% of repetitive inquiries through automated knowledge-base lookups and reduced support ticket resolution time by 35%.',
        pipeline_created:
          'Supported +$5M in partnership commitments through healthcare and data engineering workflows.',
        deals_closed:
          'Acted as Product Expert and Technical SME for RFPs tied to a $10M U.S. Political line of business.',
        time_to_close:
          'Saved approximately 60 sales operations hours per quarter by enabling non-technical teams to self-serve data insights.',
      },
      learnings: {
        what_worked:
          'Cross-functional solutioning worked best when technical demos were backed by clear business value and partner data feasibility.',
        what_id_do_differently:
          'Create more reusable internal AI tooling earlier to reduce repeated support and RFP response cycles.',
      },
    },
  },

  {
    id: 9,
    company: "San Francisco's Mayor's Office",
    role: 'Civic Tech Volunteer',
    location: 'Remote',
    industry: 'Civic Technology',
    imageSrc: '/img/logos/SF-CARD.png',
    category: 'volunteer',
    impact_summary:
      'Delivered digital literacy and civic technology support for underserved communities and small businesses. Helped translate technical tools into practical workflows for community organizations, professional services firms, and local stakeholders.',
    technologies: [
      'Zoom',
      'SquareSpace',
      'GCP',
      'Digital Literacy',
      'Technical Instruction',
      'Technical Mentorship',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Digital literacy, civic technology support, small business enablement, and practical technology education.',
        market_icp:
          'Underserved communities, small businesses, community organizations, and professional services firms needing accessible technical support.',
        deal_stage:
          'Community enablement, technical coaching, digital onboarding, and workflow support.',
      },
      problem: {
        buyer_struggles:
          'Community members and small businesses needed help adopting digital tools but often lacked technical confidence, process clarity, or affordable implementation support.',
        common_objections:
          'Concerns included time commitment, tool complexity, cost, unclear ROI, and fear of making mistakes with unfamiliar platforms.',
      },
      strategy: {
        positioning_decisions:
          'Positioned technology as a practical operating tool rather than an intimidating technical system.',
        messaging_angle:
          'Focused on accessibility, confidence, and immediate use cases such as online presence, communication, workflow organization, and customer engagement.',
        channel_selection:
          'Used remote sessions, digital literacy workshops, community-based support, and one-on-one technical mentorship.',
      },
      execution: {
        outreach_approach:
          'Worked with local stakeholders and community programs to identify technical enablement needs.',
        demo_or_call_flow:
          'Walked users through simple digital workflows, including website tools, online communication, and business technology basics.',
        follow_ups:
          'Provided practical next steps and simplified tool recommendations that users could continue applying after sessions.',
      },
      results: {
        conversion_rate:
          'Improved digital confidence among community members and small business operators.',
        pipeline_created:
          'Supported civic technology and small business enablement efforts through practical technical education.',
        deals_closed:
          'Helped community stakeholders move from low technical confidence to usable digital workflows.',
        time_to_close:
          'Reduced friction in technology adoption by simplifying tools into clear, step-by-step workflows.',
      },
      learnings: {
        what_worked:
          'Technical education works best when it starts with the user’s immediate business or community need.',
        what_id_do_differently:
          'Create reusable workshop materials and templates to scale support across more community groups.',
      },
    },
  },

  {
    id: 3,
    company: 'Blue Clover Devices',
    role: 'Senior Sales Engineer - Enterprise',
    location: 'California',
    industry: 'SAAS-Telecom',
    imageSrc: '/img/logos/BCD-CARD.png',
    category: 'professional',
    impact_summary:
      'Owned technical sales engineering across software, hardware, and manufacturing workflows. Built YAML and Docker-based microcontroller test automation, reduced troubleshooting requests by 50%, supported a $5M revenue business, and improved demo infrastructure to reduce pre-sales engineering load.',
    technologies: [
      'AWS IoT',
      'AWS EKS',
      'Arduino',
      'Nvidia Jetson',
      'Embedded ML',
      'Python',
      'Docker',
      'YAML',
      'CI/CD',
      'DevOps',
      'Hardware Testing',
      'Demo Environments',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Software and hardware manufacturing solutions, microcontroller testing, customer demo environments, and technical sales support.',
        market_icp:
          'Enterprise hardware, manufacturing, IoT, and embedded systems customers needing reliable testing, technical validation, and deployment support.',
        deal_stage:
          'Pre-sales discovery, demo environment support, RFP response, technical validation, implementation planning, and quote-to-cash lifecycle support.',
      },
      problem: {
        buyer_struggles:
          'Customers needed confidence that hardware and software workflows could handle edge cases, testing requirements, and deployment complexity.',
        common_objections:
          'Concerns included testing coverage, engineering response time, reliability, customization effort, and whether the solution could scale across customer environments.',
      },
      strategy: {
        positioning_decisions:
          'Positioned Blue Clover as a technical partner that could reduce implementation risk through better testing, documentation, and demo infrastructure.',
        messaging_angle:
          'Focused on faster technical validation, lower troubleshooting burden, and reduced engineering dependency during pre-sales.',
        channel_selection:
          'Used RFPs, case studies, technical demos, test automation workflows, and direct collaboration with the CTO and software team.',
      },
      execution: {
        outreach_approach:
          'Supported sales and technical stakeholders by gathering requirements, mapping customer edge cases, and converting them into test cases and demo flows.',
        demo_or_call_flow:
          'Maintained demo environments, walked buyers through manufacturing workflows, and demonstrated how YAML and Docker-based testing improved reliability.',
        follow_ups:
          'Documented customer requirements, built reusable test logic, and coordinated with engineering on business logic and technical issue resolution.',
      },
      results: {
        conversion_rate:
          'Reduced client troubleshooting requests for microcontroller edge cases by 50%.',
        pipeline_created:
          'Supported technical sales and RFP motion tied to a $1M manufacturing line of business.',
        deals_closed:
          'Managed sales lifecycle from quote-to-cash and RFP execution for a software and hardware manufacturing business generating $5M in revenue.',
        time_to_close:
          'Reduced cash-conversion cycle by 50% and lowered engineering involvement in pre-sales by 20% through improved demo environments.',
      },
      learnings: {
        what_worked:
          'Technical buyers responded strongly to proof that testing and demo infrastructure reduced risk before implementation.',
        what_id_do_differently:
          'Build a formal technical enablement library earlier to make RFPs, demos, and edge-case responses more repeatable.',
      },
    },
  },

  {
    id: 4,
    company: 'Hustle',
    role: 'Senior Sales Engineer - Enterprise',
    location: 'California',
    industry: 'Civic Technology',
    imageSrc: '/img/logos/HUSTLE-CARD.png',
    category: 'professional',
    impact_summary:
      'Led technical demos and customized solution design for civic engagement and enterprise messaging customers. Supported over $2M in revenue, built Python demo environments, delivered 20+ technical presentations, and improved project success through stronger sales-product-engineering collaboration.',
    technologies: [
      'AWS',
      'GCP',
      'Twilio',
      'Sisense',
      'Looker',
      'Periscope',
      'Python',
      'SQL',
      'Messaging Workflows',
      'Demo Environments',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Peer-to-peer messaging, civic engagement technology, campaign communication workflows, and customer-facing demo environments.',
        market_icp:
          'Political organizations, advocacy groups, civic engagement teams, and enterprise communication teams requiring scalable outreach workflows.',
        deal_stage:
          'Discovery, demo, pilot support, technical presentation, custom solution design, and post-sale project coordination.',
      },
      problem: {
        buyer_struggles:
          'Buyers needed scalable communication workflows that could drive engagement while fitting into campaign operations, analytics tools, and compliance-sensitive processes.',
        common_objections:
          'Concerns included user adoption, deliverability, reporting, workflow complexity, integration needs, and whether messaging could produce measurable engagement.',
      },
      strategy: {
        positioning_decisions:
          'Positioned Hustle as a high-engagement communication platform that could support campaign and organizational outreach at scale.',
        messaging_angle:
          'Focused on operational speed, engagement lift, repeatable demo workflows, and customized solutions for each organization’s outreach goals.',
        channel_selection:
          'Used technical demos, Python demo environments, executive presentations, pilots, and cross-functional delivery planning.',
      },
      execution: {
        outreach_approach:
          'Collaborated with sales and product teams to understand client requirements and shape customized solutions.',
        demo_or_call_flow:
          'Delivered 20+ technical presentations showing product capabilities, messaging workflows, reporting, and customer-specific use cases.',
        follow_ups:
          'Worked with developers and stakeholders to support project delivery, improve handoffs, and increase implementation success.',
      },
      results: {
        conversion_rate:
          'Increased user engagement by 20% through improved demo environments and solution workflows.',
        pipeline_created:
          'Helped generate over $2M in revenue through customized technical solutions.',
        deals_closed:
          'Supported enterprise and political customer wins through pilots, demos, and technical validation.',
        time_to_close:
          'Improved project success rate by 50% and team efficiency by 20% through stronger technical collaboration.',
      },
      learnings: {
        what_worked:
          'Buyers responded best when demos showed the full operating workflow, not just product features.',
        what_id_do_differently:
          'Add more structured post-demo follow-up templates tied to buyer role, use case, and implementation risk.',
      },
    },
  },

  {
    id: 5,
    company: 'Zuora',
    role: 'Business Development - Enterprise Sales',
    location: 'California',
    industry: 'SAAS-Monetization',
    imageSrc: '/img/logos/ZUORA-CARD.png',
    category: 'professional',
    impact_summary:
      'Supported enterprise business development across subscription billing and ERP integration use cases. Managed 120+ accounts, targeted $500K ARR quota, achieved 150% quota in Q4FY17, and delivered C-suite demos for SaaS and IoT companies evaluating quote-to-cash transformation.',
    technologies: [
      'Zuora',
      'Stripe',
      'NetSuite',
      'Sage Intacct',
      'Recurly',
      'Salesforce',
      'Outreach',
      'ZoomInfo',
      'ERP Integrations',
      'Quote-to-Cash',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'Subscription billing, quote-to-cash workflows, ERP integration, and recurring revenue operations.',
        market_icp:
          'Mid-sized SaaS and IoT companies evaluating subscription monetization, billing automation, and ERP-connected finance workflows.',
        deal_stage:
          'Prospecting, account qualification, C-suite demo support, pipeline generation, and early-stage enterprise sales development.',
      },
      problem: {
        buyer_struggles:
          'Finance and operations leaders needed better systems for subscription billing, revenue operations, and ERP-connected recurring revenue management.',
        common_objections:
          'Concerns included ERP integration complexity, migration risk, implementation time, and whether the platform could support evolving pricing models.',
      },
      strategy: {
        positioning_decisions:
          'Positioned Zuora as the operating system for subscription businesses moving beyond manual billing and legacy ERP workflows.',
        messaging_angle:
          'Focused on revenue scalability, quote-to-cash efficiency, and subscription model flexibility.',
        channel_selection:
          'Used outbound prospecting, account-based qualification, C-suite demos, Salesforce workflows, and sales development sequences.',
      },
      execution: {
        outreach_approach:
          'Managed a portfolio of 120+ target accounts and prioritized prospects based on ARR potential, subscription complexity, and ERP modernization needs.',
        demo_or_call_flow:
          'Supported custom demos showing Zuora integrations into ERP environments for SaaS and IoT companies.',
        follow_ups:
          'Moved qualified accounts through early-stage sales motions with tailored follow-up around billing pain points and subscription revenue operations.',
      },
      results: {
        conversion_rate:
          'Achieved 150% quota in Q4FY17 and 100% quota in Q1FY18.',
        pipeline_created:
          'Supported 120+ accounts targeting a $500K ARR quota.',
        deals_closed:
          'Contributed to enterprise pipeline through qualified opportunities and C-suite demo support.',
        time_to_close:
          'Improved early-stage opportunity progression by aligning outreach with finance and operations pain points.',
      },
      learnings: {
        what_worked:
          'Subscription buyers responded best when the message connected billing automation to revenue model flexibility.',
        what_id_do_differently:
          'Develop more technical integration fluency earlier to deepen discovery with finance and systems stakeholders.',
      },
    },
  },

  {
    id: 6,
    company: 'Copper CRM',
    role: 'Business Development',
    location: 'California',
    industry: 'SaaS-CRM',
    imageSrc: '/img/logos/COPPERCRM-CARD.png',
    category: 'professional',
    impact_summary:
      'Supported CRM growth motion through high-volume demos, outbound prospecting, account qualification, and product feedback. Exceeded 100% quota every quarter, delivered 20+ demos per week, and contributed to customer account health tracking feature research.',
    technologies: [
      'Copper CRM',
      'GCP',
      'Zapier',
      'Tray.ai',
      'REST APIs',
      'Product Research',
      'Salesforce',
      'GTM Systems',
      'SME',
    ],
    case_study: {
      context: {
        product_service:
          'CRM software, sales workflow automation, account management, and customer health tracking.',
        market_icp:
          'Growing sales teams and revenue organizations needing a simpler CRM connected to daily GTM workflows.',
        deal_stage:
          'Prospecting, qualification, demo delivery, account development, product feedback, and customer workflow discovery.',
      },
      problem: {
        buyer_struggles:
          'Sales teams needed CRM adoption without heavy administrative burden, disconnected workflows, or poor visibility into customer health.',
        common_objections:
          'Concerns included CRM switching costs, integration needs, user adoption, data quality, and whether a new CRM would improve day-to-day seller productivity.',
      },
      strategy: {
        positioning_decisions:
          'Positioned Copper as a workflow-friendly CRM for teams that wanted simpler adoption and better visibility into customer relationships.',
        messaging_angle:
          'Focused on productivity, account health visibility, workflow automation, and ease of use.',
        channel_selection:
          'Used high-volume demos, outbound sequences, account research, CRM workflow discovery, and product feedback loops.',
      },
      execution: {
        outreach_approach:
          'Qualified accounts through targeted prospecting and tailored messaging around CRM pain points and sales workflow inefficiencies.',
        demo_or_call_flow:
          'Delivered 20+ demos per week focused on user workflows, automation, account visibility, and CRM adoption.',
        follow_ups:
          'Captured buyer feedback and supported product research for account health tracking features.',
      },
      results: {
        conversion_rate:
          'Exceeded 100% quota every quarter.',
        pipeline_created:
          'Generated qualified CRM pipeline through consistent outbound execution and demo delivery.',
        deals_closed:
          'Supported closed-won opportunities through qualification, demo execution, and buyer education.',
        time_to_close:
          'Improved buyer education by connecting CRM features to daily revenue workflows and adoption pain points.',
      },
      learnings: {
        what_worked:
          'CRM buyers cared less about feature volume and more about whether the workflow would actually be adopted by sellers.',
        what_id_do_differently:
          'Add deeper technical discovery around integrations earlier in the sales cycle.',
      },
    },
  },

  {
    id: 8,
    company: 'Wells Fargo',
    role: 'Financial Analyst',
    location: 'California',
    industry: 'Banking',
    imageSrc: '/img/logos/WELLSFARGO-CARD.png',
    category: 'professional',
    impact_summary:
      'Built financial analysis and underwriting workflows for commercial real estate transactions. Developed financial modeling framework mapped to $30M in originations, analyzed property-level cash flows, and supported diligence across a $1B real estate portfolio.',
    technologies: [
      'Financial Modeling',
      'Commercial Real Estate',
      'MS Excel',
      'Bloomberg Terminal',
      'PitchBook',
      'FactSet',
      'Investment Research',
      'Underwriting',
    ],
    case_study: {
      context: {
        product_service:
          'Commercial real estate underwriting, property-level cash flow analysis, diligence support, and financial modeling.',
        market_icp:
          'Commercial real estate banking, lending, investment, and portfolio management teams evaluating property performance and transaction risk.',
        deal_stage:
          'Financial analysis, diligence, underwriting support, portfolio review, and origination analysis.',
      },
      problem: {
        buyer_struggles:
          'Banking and investment teams needed reliable property-level financial analysis to assess deal quality, borrower risk, and portfolio exposure.',
        common_objections:
          'Concerns included cash flow assumptions, valuation sensitivity, market risk, borrower quality, and whether projected performance supported financing decisions.',
      },
      strategy: {
        positioning_decisions:
          'Positioned financial modeling as a decision-support system for faster, more consistent underwriting and portfolio review.',
        messaging_angle:
          'Focused on risk clarity, cash flow visibility, transaction readiness, and better origination decision-making.',
        channel_selection:
          'Used Excel-based modeling, research tools, financial reviews, internal diligence workflows, and portfolio-level analysis.',
      },
      execution: {
        outreach_approach:
          'Worked with internal banking and real estate stakeholders to gather property, borrower, market, and transaction data.',
        demo_or_call_flow:
          'Built and reviewed financial models showing cash flow, debt service, valuation assumptions, and deal-level risk factors.',
        follow_ups:
          'Authored financial reviews, updated diligence materials, and refined assumptions based on stakeholder feedback.',
      },
      results: {
        conversion_rate:
          'Improved consistency of underwriting analysis through a structured financial modeling framework.',
        pipeline_created:
          'Developed a financial modeling framework mapped to $30M in commercial real estate originations.',
        deals_closed:
          'Supported diligence and analysis across a $1B real estate portfolio.',
        time_to_close:
          'Helped accelerate internal review by organizing property-level cash flows and investment assumptions into clearer decision frameworks.',
      },
      learnings: {
        what_worked:
          'Real estate decision-makers valued clear assumptions, downside scenarios, and direct links between property performance and financing risk.',
        what_id_do_differently:
          'Automate more of the data ingestion and sensitivity analysis process to reduce manual model maintenance.',
      },
    },
  },
]

export default function Page() {
  return (
    <>
      <HeroLeftAlignedWithDemo
        id="hero"
        headline="GTM Fanatic"
        subheadline={
          <p>
           A passionate problem-solver with a proven track record of driving complex technical sales for Fortune 500 clients.
          </p>
        }
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href="#" size="lg">
              Calendly
            </ButtonLink>

            <PlainButtonLink href="#" size="lg">
              AI Experiments <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        }
      />

      <SeStatsCard
        id="stats"
        className="scroll-mt-24"
        eyebrow="My track record"
        headline="Trusted by Sales Leaders"
        description={
          <p>
            I translate complex technical products into enterprise-ready demos, proof-of-concepts, and revenue-driving solutions for AI, data, and SaaS teams
          </p>
        }
        imageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80"
        imageAlt=""
        stats={stats}
      />

      <SeCaseStudies
        id="case-studies"
        className="scroll-mt-24"
        headline="Case studies"
        subheadline="A focused snapshot of the work, revenue, and systems I’ve helped build across professional and volunteer roles."
        items={caseStudies}
      />

      <TestimonialThreeColumnGrid
        id="testimonial"
        headline="Testimonies"
        subheadline={<p>Selected recommendations from sales, solutions, and leadership partners I have worked with directly.</p>}
      >
        <Testimonial
          quote={
            <p>
              Malcolm is one of best business minds that I have ever hired and collaborated with. He has the ability
              to decompose complex business problems for non-business savvy stakeholders and engineers to develop
              solutions that generate substantial value to the business. 
              <br></br>
              <br></br>
              A rapid learner, a team player, and someone
              willing to get his hands dirty building prototypes with an unfamiliar tech stack combined with business
              acumen and ethics is a rare combination of skills today. If you are looking for product or solutions
              development roles, Malcolm would be a good fit.
            </p>
          }
          img={
            <Image
              src="/img/avatars/10-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Shamshu Dharwez"
          byline="Head of Enterprise Solutions, MiQ US"
        />
        <Testimonial
          quote={
            <p>
              Absolute pleasure to work with. Growth minded, self starter, lots of internal motivation to grow into a
              role. Very receptive to coaching. Hungry. 
              <br></br>
              <br></br>
              Very comfortable when thrown in the deep end, no floaties. I
              hope one day he forgives me for that, by the way.
            </p>
          }
          img={
            <Image
              src="/img/avatars/15-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Jesse Hassinger"
          byline="CEO at Hustle"
        />
        <Testimonial
          quote={
            <p>
              Malcolm embodies a legacy growth mindset and bolsters a dedication to boundless creativity. If you get a
              chance to know him then it is you that should be honored. 
              <br></br>
              <br></br>
              No single accomplishment can compare to a novel
              state of mind and Malcolm&apos;s mind is limitless.
            </p>
          }
          img={
            <Image
              src="/img/avatars/13-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Steve Straughter"
          byline="CEO at TSG"
        />
      </TestimonialThreeColumnGrid>
    </>
  )
}