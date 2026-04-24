// Static/curated reviewer data used on the homepage, feedback page, and
// public profile pages for non-registered reviewers.

export interface StaticReview {
  slug: string;
  name: string;
  rating: number; // 1–5
  message: string;
  memberSince: string; // displayed as-is on the profile page
}

export const STATIC_REVIEWS: StaticReview[] = [
  {
    slug: "lara-haddad",
    name: "Lara Haddad",
    rating: 5,
    message:
      "Honestly one of the best experiences I've had booking a stay in Lebanon. The listing was exactly as described and the host was super welcoming. Will definitely be using Beitak again this summer!",
    memberSince: "March 2025",
  },
  {
    slug: "charbel-gemayel",
    name: "Charbel Gemayel",
    rating: 5,
    message:
      "Found an amazing cabin in the mountains for our family trip and the whole process was smooth from start to finish. Highly recommend.",
    memberSince: "April 2025",
  },
  {
    slug: "maya-nassar",
    name: "Maya Nassar",
    rating: 4,
    message:
      "Kenet khayfe ma ykon metl ma bil soura bas wallah surprise! The place was even better in person. Andrew and Roy were very helpful and responsive throughout the whole process, top guys!",
    memberSince: "May 2025",
  },
  {
    slug: "elie-khoury",
    name: "Elie Khoury",
    rating: 5,
    message:
      "We booked a villa for my sister's birthday and it was perfect. The host had everything ready and the communication through WhatsApp was fast and easy. Beitak is the future of local travel.",
    memberSince: "June 2025",
  },
  {
    slug: "nadine-frem",
    name: "Nadine Frem",
    rating: 5,
    message:
      "Super easy to use and the listings are beautiful. Found exactly what I was looking for in under 5 minutes. The WhatsApp booking is a great idea, very Lebanese and very practical!",
    memberSince: "July 2025",
  },
  {
    slug: "georges-abou-zeid",
    name: "Georges Abou Zeid",
    rating: 4,
    message:
      "3ajabne ktir el fikra. Lebnen 3ando kell shi w hala2 fi platform tojme3 kell hal amakin l helwe. Bas yaret yzido aktar listings la zouk mikael w jbeil.",
    memberSince: "August 2025",
  },
  {
    slug: "tania-sleiman",
    name: "Tania Sleiman",
    rating: 5,
    message:
      "Booked a cozy apartment in Broummana for the weekend and it was everything we needed. Clean, well equipped, and the host was lovely. Thank you Beitak!",
    memberSince: "September 2025",
  },
  {
    slug: "joe-moussa",
    name: "Joe Moussa",
    rating: 5,
    message:
      "Yiii shu helwe hal website! Sahel ktir w el listings 3melinhon professional. 10/10 would recommend.",
    memberSince: "October 2025",
  },
  {
    slug: "rima-antoun",
    name: "Rima Antoun",
    rating: 4,
    message:
      "Had a small issue with the booking details but the team sorted it out immediately. Great customer care and a really lovely platform overall. Keep it up guys!",
    memberSince: "November 2025",
  },
  {
    slug: "karim-hamdan",
    name: "Karim Hamdan",
    rating: 5,
    message:
      "Finally a Lebanese platform that actually works and looks good. We used Beitak for our company retreat and found an amazing property in Ehden. Will 100% use again.",
    memberSince: "January 2026",
  },
  {
    slug: "celine-abi-khalil",
    name: "Celine Abi Khalil",
    rating: 5,
    message:
      "Ma kenet 3arfe shu taw2a3 bas el villa ken amazing. El host kan responsive w Andrew w Roy helped us sort everything out quickly.",
    memberSince: "February 2026",
  },
  {
    slug: "fadi-raad",
    name: "Fadi Raad",
    rating: 4,
    message:
      "Good selection of properties and the interface is clean and easy to navigate. Would love to see more listings added in the south and Bekaa. Overall great experience!",
    memberSince: "March 2026",
  },
];

export function getStaticReviewBySlug(slug: string): StaticReview | undefined {
  return STATIC_REVIEWS.find((r) => r.slug === slug);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// The 3 reviews shown on the homepage — order matters.
export const HOME_REVIEW_SLUGS = ["elie-khoury", "maya-nassar", "tania-sleiman"];
