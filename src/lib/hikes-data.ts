import hike1 from "@/assets/hike-1.jpg";
import hike2 from "@/assets/hike-2.jpg";
import hike3 from "@/assets/hike-3.jpg";
import hike4 from "@/assets/hike-4.jpg";

export type Difficulty = "Easy" | "Moderate" | "Hard" | "Expert";

export interface Hike {
  id: string;
  slug: string;
  title: string;
  location: string;
  image: string;
  date: string;
  durationHours: number;
  elevationM: number;
  difficulty: Difficulty;
  spotsLeft: number;
  maxParticipants: number;
  organizer: { name: string; avatar: string; level: string };
  description: string;
  meetingPoint: string;
  equipment: string[];
}

export const hikes: Hike[] = [
  {
    id: "1",
    slug: "emerald-lake-loop",
    title: "Emerald Lake Loop at Sunrise",
    location: "Chamonix, France",
    image: hike1,
    date: "Sat, May 16 · 06:30",
    durationHours: 5,
    elevationM: 620,
    difficulty: "Moderate",
    spotsLeft: 3,
    maxParticipants: 8,
    organizer: { name: "Léa Martin", avatar: "https://i.pravatar.cc/120?img=47", level: "Advanced" },
    description:
      "Join us for a peaceful sunrise loop around the emerald lake. We'll catch the first light reflecting off the peaks and share a warm coffee at the top. Friendly pace, photo stops welcome.",
    meetingPoint: "Parking des Praz, Chamonix",
    equipment: ["Hiking boots", "1.5L water", "Headlamp", "Light jacket"],
  },
  {
    id: "2",
    slug: "mossy-forest-trail",
    title: "Mossy Forest Easy Trail",
    location: "Black Forest, Germany",
    image: hike2,
    date: "Sun, May 17 · 09:00",
    durationHours: 3,
    elevationM: 220,
    difficulty: "Easy",
    spotsLeft: 6,
    maxParticipants: 10,
    organizer: { name: "Tomás Vogel", avatar: "https://i.pravatar.cc/120?img=12", level: "Intermediate" },
    description: "A gentle forest walk perfect for beginners and families. Sunbeams through pines, mossy paths, and a riverside picnic.",
    meetingPoint: "Triberg train station",
    equipment: ["Comfortable shoes", "Water", "Snack"],
  },
  {
    id: "3",
    slug: "summit-ridge-traverse",
    title: "Summit Ridge Traverse",
    location: "Dolomites, Italy",
    image: hike3,
    date: "Sat, May 23 · 05:00",
    durationHours: 9,
    elevationM: 1450,
    difficulty: "Hard",
    spotsLeft: 2,
    maxParticipants: 6,
    organizer: { name: "Marco Bellini", avatar: "https://i.pravatar.cc/120?img=33", level: "Expert" },
    description: "A challenging traverse along an exposed ridge with breathtaking 360° views. Experienced hikers only.",
    meetingPoint: "Rifugio Auronzo",
    equipment: ["Boots", "Helmet", "2L water", "Energy bars", "Wind shell"],
  },
  {
    id: "4",
    slug: "wildflower-meadow",
    title: "Wildflower Meadow Walk",
    location: "Bavarian Alps, Germany",
    image: hike4,
    date: "Sun, May 24 · 10:00",
    durationHours: 4,
    elevationM: 380,
    difficulty: "Easy",
    spotsLeft: 5,
    maxParticipants: 12,
    organizer: { name: "Anna Keller", avatar: "https://i.pravatar.cc/120?img=45", level: "Intermediate" },
    description: "Spring is in full bloom. Walk through endless wildflower fields with the alps on the horizon.",
    meetingPoint: "Garmisch-Partenkirchen Bahnhof",
    equipment: ["Trail shoes", "Sunscreen", "Water"],
  },
];

export const getHike = (slug: string) => hikes.find((h) => h.slug === slug);
