---
layout: home
outline: false
prev: false
next: false
title: "Recommendations"
description: "Professional recommendations and testimonials for Stevanus Satria from colleagues and mentees, highlighting his expertise in product management and software development."
keywords: "Stevanus Satria, recommendations, testimonials, product management, software development, mentorship"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Recommendations"
  - - meta
    - property: og:description
      content: "Professional recommendations and testimonials for Stevanus Satria from colleagues and mentees, highlighting his expertise in product management and software development."
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:url
      content: https://stevanussatria.com/recommendations
  - - meta
    - name: twitter:title
      content: "Recommendations"
  - - meta
    - name: twitter:description
      content: "Professional recommendations and testimonials for Stevanus Satria from colleagues and mentees, highlighting his expertise in product management and software development."
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - link
    - rel: canonical
      href: https://stevanussatria.com/recommendations
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const Recommendations = defineAsyncComponent(() => 
  import('./components/Recommendations.vue')
)

interface Recommendation {
    id: string;
    name: string;
    title: string;
    company: string;
    testimonial: string;
    date?: string; // ISO date string (YYYY-MM-DD)
}

const recommendationData: Recommendation[] = [
  {
    "id": "39",
    "name": "Arkadiy Rushkevich",
    "title": "Director of Product Management",
    "company": "Workato",
    "date": "November 7, 2025",
    "testimonial": "I had the pleasure of managing Steve during his time at Workato, and he consistently impressed me with his ability to combine user-centric thinking, technical depth, and strong ownership. Steve started in the Workato Connectors area and quickly proved he can handle ownership of much more complex product of Data Tables, where he quickly caught up on backlog delivery and reframed the roadmap to align with our low-code/no-code strategy, showing adaptability and strategic thinking. Beyond features, Steve was instrumental in ensuring our connectors met enterprise expectations. He led the charge in initiatives related to authentication and security, regulatory compliance, and improved connector reliability. I strongly recommend him to any organization looking for someone who can drive meaningful impact at both product and organizational levels."
  },
  {
    "id": "38",
    "name": "Vishakan Subramanian",
    "title": "Software Development Engineer",
    "company": "Workato",
    "date": "April 23, 2025",
    "testimonial": "I have had the good fortune of working with Steve closely in the last couple of years as part of Workato's connectors engineering initiatives. In our frequent collaborative efforts, the thing that has stuck with me the most about Steve is his tenacity to ensure that problems are truly solved and his doggedness in getting things done. His mindfulness and the insightfulness he brings in from a customer-centric perspectives truly has truly helped us build quality deliverables. From personal experience, I have observed Steve to be a strong team-player, detail-oriented and very resourceful. Aside from commendable product skills, Steve is also excellent at juggling cross-team collaborations, ensuring that multiple teams are on the loop and ensure a smooth workflow. I believe that Steve's technical background is a great plus for our organization - due to his product expertise combined with a solid understanding of our platform's inner workings, he is immensely able in triaging complex customer issues with alacrity while also leading the product's development in a clear and effective direction. Steve's ability to work cross-team with engineering, customer support and leadership teams makes him a worthy product manager! Any organization out there would be blessed to have such a meticulous person as part of their team. I'm particularly grateful and happy to have the chance to work with him - I've found myself to be very inspired by his breadth and depth of domain knowledge and his growth so far!"
  },
  {
    "id": "37",
    "name": "Chisin Ng",
    "title": "Product Manager",
    "company": "Workato",
    "date": "July 30, 2024",
    "testimonial": "I was very fortunate to have Steve as not just a teammate but also a mentor during my internship at Workato. Working with him was a truly fruitful experience. He is knowledgeable in the SaaS product domain, which allowed me to pick up extensive technical knowledge under his guidance. As an experienced product manager, he went above and beyond to help me develop my product management skills. He is skilled in all aspects of product management, from product discovery and problem framing to technical delivery and stakeholder management. He's also very nurturing, creating an environment where I was not afraid to ask questions, make mistakes, and try new things. His mentorship was invaluable, and I learned so much from him. Any team is lucky to have him!"
  },
  {
    "id": "36",
    "name": "Swathi Asokraj",
    "title": "Software Development Engineer",
    "company": "Workato",
    "date": "April 3, 2024",
    "testimonial": "It was a pleasure working alongside Stevanus Satria. He is a dedicated and insightful professional in the field. Throughout our collaboration, he consistently demonstrated exceptional intellect and clarity of thought. Always approachable and ready to assist with any doubts, he ensured that the team members felt supported and empowered. Steve has a remarkable dedication to customer satisfaction, consistently valuing feedback and going above and beyond to address their needs."
  },
  {
    "id": "35",
    "name": "Alyssa De Conceicao",
    "title": "Associate Product Manager",
    "company": "Shopee",
    "date": "June 13, 2025",
    "testimonial": "Stevanus has consistently gone the extra mile as a mentor—offering grounded, thoughtful advice and generously sharing his time with actionable tips that have helped me advance my career with greater clarity. His deep product and technical expertise, developed over years across diverse experiences as a product manager and engineer, has been especially impactful, helping me sharpen my ability to prioritize effectively and strategically prepare for pivotal career opportunities. I truly appreciate the opportunity to have learned from Stevanus, whose practical wisdom and dedication have been extremely valuable."
  },
  {
    "id": "34",
    "name": "Rahul M Jacob",
    "title": "Product Manager Operations",
    "company": "Uber",
    "date": "January 9, 2025",
    "testimonial": "I had a great conversation with Stevanus, where he shared valuable insights about the product landscape in Singapore. I truly appreciate his willingness to assist and the valuable guidance he provided."
  },
  {
    "id": "33",
    "name": "Karen Kaycia",
    "title": "Merchandiser",
    "company": "PT Mitra Adiperkasa Tbk.",
    "date": "May 26, 2024",
    "testimonial": "Had a really great session talking about my career with Ko Stevanus. Thank you for the advices, Ko Stevanus! Honestly they're really insightful and have helped me to better understand myself on which path I should be taking. Thank you for giving me an insight on what a product manager does, too."
  },
  {
    "id": "32",
    "name": "Sharon Siah",
    "title": "Student",
    "company": "SMU",
    "date": "April 11, 2023",
    "testimonial": "Stevanus is a dedicated mentor who has helped me grow both personally and professionally. He encourages me to think strategically and consider the bigger picture. He is patient, supportive and an excellent communicator."
  },
  {
    "id": "31",
    "name": "Jean Ong",
    "title": "Programmer",
    "company": "Arup",
    "date": "February 6, 2023",
    "testimonial": "I had a great chat with Stevanus! He is both knowledgeable and insightful. I learnt a lot from his sharing. He is a great connection to have!"
  },
  {
    "id": "30",
    "name": "Tulika Khabia",
    "title": "Assistant Product Manager",
    "company": "Zaggle",
    "date": "September 21, 2022",
    "testimonial": "I had an amazing session with Steve. He comes from rich product experience. He's very detail oriented and very helpful. My session with him was very helpful and I'll definitely be booking another session with him."
  },
  {
    "id": "29",
    "name": "Maxwell Kabona",
    "title": "Business Data Analyst",
    "company": "DevelopmentShift Consulting Ltd",
    "date": "September 12, 2022",
    "testimonial": "Stevanus' insights were extremely helpful and he allowed me to express a lot of what was on my mind comfortably. He went the extra mile in providing me with useful information to guide me on my path."
  },
  {
    "id": "28",
    "name": "Zioedy Wong",
    "title": "UX Researcher and Writer",
    "company": "Section",
    "date": "September 10, 2022",
    "testimonial": "Stevanus was very helpful in his sharing about Product Management and interview preparations."
  },
  {
    "id": "27",
    "name": "Yao Yao",
    "title": "Business Associate",
    "company": "Visa",
    "date": "July 24, 2022",
    "testimonial": "Stevanus offers great perspectives on the varying working culture and scope of a product manager. He gives very practical advice on how to upskill and prepare for a career switch. He is super approachable, open and resourceful. Definitely would recommend anyone who is interested in becoming a PM to talk to him."
  },
  {
    "id": "26",
    "name": "Shahroze Husain",
    "title": "Head of Strategy | Product Manager",
    "company": "Apex Husain",
    "date": "June 1, 2022",
    "testimonial": "Super insightful and helpful. Stevanus as a mentor goes over and above to help you understand the role of a PM and how to navigate the job search. Highly recommend!"
  },
  {
    "id": "25",
    "name": "Clement Perdana",
    "title": "Digital Product Manager",
    "company": "DBS",
    "date": "April 29, 2022",
    "testimonial": "Stevanus is very knowledgeable and passionate about his PM role. He gave me the advice to help me start my first PM role. And not only that, but he also clears my doubt about what and how a PM do their day to day job. It's very insightful to talk with Stevanus, who is very knowledgeable about the industry. I highly recommend him to be your mentor too!"
  },
  {
    "id": "24",
    "name": "Kevin Govinda",
    "title": "Management Trainee",
    "company": "CIMB Niaga",
    "date": "April 26, 2022",
    "testimonial": "Insightful, Warm, and Fun describes the session I had with kak Stevanus. He is very candid and willing to share his learnings as a PM."
  },
  {
    "id": "23",
    "name": "Yashi Huang",
    "title": "Senior Product Manager",
    "company": "Pitchbook",
    "date": "April 11, 2022",
    "testimonial": "I had a great conversation with Stevanus. He was super knowledgeable on the product management related topics and interviews and he was able to bring his own working experiences to help you from a practical standpoint. He gave great suggestions and provided a structured framework on how to tackle certain problems. I highly recommend everyone to have a chat with him and learn from him."
  },
  {
    "id": "22",
    "name": "Stephanie Gascon",
    "title": "Customer Success Operations Manager",
    "company": "Nugit",
    "date": "March 5, 2022",
    "testimonial": "Stevanus gave helpful suggestions on how to show aptitude when trying for a first-time PM role and shared his experiences with problem-solving and career progression. Do have a chat with him to hear his valuable perspectives."
  },
  {
    "id": "21",
    "name": "Lim Mun Hong",
    "title": "Data Analyst",
    "company": "Top Glove",
    "date": "February 28, 2022",
    "testimonial": "Steve is a nice and experienced person who knows what he is doing. He provided a lot of useful insight to me and I'm super grateful for this opportunity to talk to him."
  },
  {
    "id": "20",
    "name": "Hue Nguyen",
    "title": "Business Analyst",
    "company": "Doxa",
    "date": "February 19, 2022",
    "testimonial": "I am grateful to have an extraordinary 1-hour session with Stevanus. He shared from the bottom of his heart. He gave me actionable and valuable advice on how to prepare to jump into the role of PM. He shared with me great sources to start with as a junior PM. Words can barely express how thankful I am."
  },
  {
    "id": "19",
    "name": "Preston Ong Jin Bin",
    "title": "Student",
    "company": "Monash University",
    "date": "December 23, 2021",
    "testimonial": "Stevanus is kind and generous in sharing his knowledge about Product Management. Learnt a lot about PM as a student from him albeit a short mentorship session!"
  },
  {
    "id": "18",
    "name": "Ahmed",
    "title": "Senior Product Manager",
    "company": "ShopBack",
    "date": "December 21, 2021",
    "testimonial": "I had a nice chat with Stevanus. I appreciate his candidness about his onboarding experiences and some of the possible pitfalls I should be aware of when it comes to joining new teams/companies. His career journey would be very useful for others on a similar trajectory to learn from."
  },
  {
    "id": "17",
    "name": "Siyu (Henry) Tang",
    "title": "Assistant Manager, Marketplace Product",
    "company": "Shopee",
    "date": "September 5, 2022",
    "testimonial": "I worked with Steve in Chat product in Shopee. Steve has been a great contributor and trust-worthy product manager. He has demonstrated impressive ability to learn and strong attention to details, proactively taking ownership and open to opportunities to help and improve. He was also able to consciously leveraged his technical background in forming deep understanding of product logic and contributing to the team with insights. I truly believe Steve will be a valuable asset to any organization."
  },
  {
    "id": "16",
    "name": "Joanne Tan",
    "title": "Senior Associate, Product Management",
    "company": "Shopee",
    "date": "July 24, 2022",
    "testimonial": "Worked with Steve together to build up the Chat product and he is such a great teammate to work with! A great contributor to ideas with his technical background that value-adds, he's also a team player who builds up the team. I really enjoyed my time collaborating with him and solving problems together, definitely a recommendation."
  },
  {
    "id": "15",
    "name": "Xiang Rong Ong",
    "title": "Associate, Product Management",
    "company": "Shopee",
    "date": "July 18, 2022",
    "testimonial": "While working alongside Steve, I was thoroughly impressed by Steve's commitment to the product he's managing. He's a meticulous and forward thinking product manager and also a great team player. Definitely an asset to a team!"
  },
  {
    "id": "14",
    "name": "Laurinda Wu",
    "title": "Associate, Product Management",
    "company": "Shopee",
    "date": "July 24, 2022",
    "testimonial": "It was fantastic to work together with Steve! He is a motivated, forward-thinking, inspiring and dedicated. He has expertise in UI design tools and technical implementation. I did learnt a lot from him when we worked together!"
  },
  {
    "id": "13",
    "name": "Rachel Esther Chan",
    "title": "Product Management Intern",
    "company": "Shopee",
    "date": "March 29, 2024",
    "testimonial": "During my 3-month internship stint at Shopee, I had the opportunity to work with Stevanus as my mentor. This was during my early phases in the space of Product Management. Steve played a quinessential role in growing and nurturing my skillset - especially in this area. He taught me to be especially meticulous in my work and guided me in the ways of Product Management, from basics of constructing a PRD (Product Requirement Document) to communicating with cross functional stakeholders in a fast evolving company like Shopee. Even after I finished my internship, I witnessed Steve continue to lead in this space and mentoring others. I am confident that any team would benefit greatly from his addition."
  },
  {
    "id": "12",
    "name": "Gus Salamoun",
    "title": "Vice President, Airport IT R&D",
    "company": "Amadeus",
    "date": "January 27, 2022",
    "testimonial": "Stevanus was a member of my department as a systems analyst in my capacity as VP Research & Development. I recruited Stevanus as an IT Graduate Intern when i spotted in him his passion and zeal about what he does. Detailed, perseverant, hardworking, flexible, and self-driven are but few qualities to describe Stevanus. Very competent and have the drive to teach himself. He always volunteered to onboard new areas of knowledge. He possesses great technical knowledge and is always ready to make his skills current. It has been my privilege having such a reliable colleague on my team. Stevanus is a great asset, I strongly recommend him."
  },
  {
    "id": "11",
    "name": "Stephanie Tan",
    "title": "Senior Manager, Airport IT R&D",
    "company": "Amadeus",
    "date": "December 26, 2020",
    "testimonial": "I started mentoring Stevanus since he joined through our Graduate Trainee Program. In that 2 years, he chartered several complex situations and stood the test. He exhibited strong adaptability and quick reactivity to derive creative solution. A highly energetic and willing to learn individual contributor who challenges status quo and has a diverse skill set. He has the potential to achieve any goal and excel once he puts his mind and heart into it, a valuable team player to have in any company."
  },
  {
    "id": "10",
    "name": "Jyolsna Elangovan",
    "title": "Senior Engineering Manager, Airport IT R&D",
    "company": "Amadeus",
    "date": "July 29, 2019",
    "testimonial": "Stevanus is a proficient and hard working professional with a can-do attitude. He is a quick learner and adapts well to new technology, people and different cultures. For the 5 months tenure he worked for my group at Amadeus Bangalore, he did an excellent job of completing the UI migration to Angular and demonstrated a thorough end to end approach. I was very happy to see him always relate to the bigger picture with a great sense of maturity and responsibility. Steve is definitely a great asset to any team he works for."
  },
  {
    "id": "9",
    "name": "Gwendolin Tan",
    "title": "Functional Analyst, Airport IT R&D",
    "company": "Amadeus",
    "date": "July 10, 2021",
    "testimonial": "I worked with Stevanus during his time as a business analyst and then again when he joined the development team. He is a very efficient and hardworking individual. It is a joy to work with him as he often brings up a different perspective and is meticulous about the way he delivers any requirement. Even as a developer, he seeks to understand the use case of the function and voices out concerns and improvements to both the technical and functional solution. He is a driven individual who thrives in an environment that isn't restrictive and allows leeway for feedback and improvement. Any company that hires him would find him an asset."
  },
  {
    "id": "8",
    "name": "Jameel Shaik",
    "title": "Senior QA Engineer, Airport IT R&D",
    "company": "Amadeus",
    "date": "March 15, 2021",
    "testimonial": "We both worked together as part of the Development Team in Amadeus Airport IT. I recognize Stevanus as a young talent who adapted to multiple roles in a short period of time. As a software developer, Stevanus proactively seek clarifications and delivered his work ahead of time and in good quality. Aside from being a dependable software developer, Stevanus always brought new ideas to the Team. One of the most memorable ideas was \"Among Us\", which was a collaborative remote exercise meant that encouraged interpersonal connection amidst lockdown to boost each other's emotional well-being. The idea quickly became a staple in our Daily Stand-up Meetings, and the Team's reception was positive. Stevanus will be an asset to any organization looking for a technical individual with a knack for thinking out-of-the-box."
  },
  {
    "id": "7",
    "name": "Zeyao Liu",
    "title": "Senior Software Engineer, Airport IT R&D",
    "company": "Amadeus",
    "date": "December 1, 2020",
    "testimonial": "For the last 1 year, Stevanus worked with me as a teammate at Amadeus Singapore. What I like about Stevanus is his ability to move fast, all the tasks assigned to him were delivered faster than expected and with great quality. Stevanus is always willing to learn new skills, not only technically but also in agile development concepts. Stevanus is a good team player and is able to take ownership of what he works on. He also shows impressive skills in communicating with different stakeholders and is always thinking about the big picture of how to make our software product better. Stevanus is definitely a great engineer to work with."
  },
  {
    "id": "6",
    "name": "Satyaranjan Muduli",
    "title": "Member Technical Staff, Airport IT R&D",
    "company": "Amadeus",
    "date": "December 1, 2020",
    "testimonial": "It was my pleasure to work with Steve, who is an efficient Developer. He has a very strong work ethic and unparalleled analytic and problem solving skills. Steve is a organized and customer-service oriented perfectionist, has no problem to work hard when necessary. Energetic and broad-minded Developer - that's him! Detail oriented team player. Besides being a joy to work with, Steve is a take-charge person who is able to present creative solutions to complex problems and communicate the benefits to the company. I definitely would recommend him as Developer."
  },
  {
    "id": "5",
    "name": "Gopinath Gunanithi",
    "title": "System Analyst, Airport IT R&D",
    "company": "Amadeus",
    "date": "December 2, 2020",
    "testimonial": "I got an opportunity to work with Stev at Amadeus software labs. Being a senior to him, I was literally amazed seeing such a young talent who can learn and adapt anything in a lightning speed. And with in very short span he played different roles like business analyst and a wonderful programmer. He is so committed and very clear in getting the things done. Very friendly guy who can mingle with the team well. He is not just a resource but he is an asset to any organisation."
  },
  {
    "id": "4",
    "name": "Thejashree Chandraiah",
    "title": "PMO Process & Methodology Specialist",
    "company": "Amadeus",
    "date": "May 23, 2022",
    "testimonial": "Steve is an enthusiastic and reliable work buddy. He is a quick learner and team player. His proactive nature of bringing new ideas and connecting the dots is appreciable. Though we didn't work together in a team, glad I had the opportunity to discuss and exchange ideas with him, which has supported to think out of box. Many thanks and good luck friend :)"
  },
  {
    "id": "3",
    "name": "Colin McKell-Redwood",
    "title": "Product Manager",
    "company": "Amadeus",
    "date": "August 4, 2020",
    "testimonial": "Stevanus is a great guy to work with. In the project we worked on, he was very well organised, contributed enthusiastically to the project, going well beyond his direct responsibilities, and looking at the overall picture. Taking the initiative, delivering on time, and contributing fully to a successful outcome, Stevanus is a pleasure to work with."
  },
  {
    "id": "2",
    "name": "Ray Pan",
    "title": "Software Developer",
    "company": "Works Applications",
    "date": "October 13, 2019",
    "testimonial": "I worked with Steve in the same office when both of us were Software Developers at Works Applications. Steve is energetic, smart and helpful. I still remember when we were in the probation period he was always the fastest person to finish up the required tasks and got feedback from our manager in time. Steve is also an excellent team player. He is super easygoing and pleasant to work with, especially in an international and multilingual environment. Example? He made friends with almost everyone in our new hire batch in just a few weeks. Besides, his curiosities in tech trends and the will to push himself out of his comfort zone always impress me: Steve picked up a few front-end frameworks when he developed the HR management mobile app, under very tight time-constraints; he is also an enthusiastic meet-up participant about tech trends and programming skills. Those companies who are looking for a team player with a passion for techs and excellent interpersonal skills should definitely consider Steve."
  },
  {
    "id": "1",
    "name": "Harry Nguyen",
    "title": "Research Officer, Robotics Innovation Lab",
    "company": "SUTD",
    "date": "July 10, 2019",
    "testimonial": "I had the privilege to work with Stevanus in several course-works and final year project when we were at undergraduate school. Later, we worked together SUTD robotics lab over a year. He is the recipient of countless highly prestigious award from our school, industrial partners and other academic bodies. Stevanus is a creative thinker and hardworking doer who is excel at both theory and hands-on tasks. In group works, he always takes lead with example in every single project. He strives for the best and delivers the highest-quality projects. He also cares about his peers, motivating them and giving them the best advice. I think that with his qualities, Stevanus can thrive in his future career and achieve the bests in his life."
  }
]

</script>

<Recommendations :recommendations="recommendationData" />
