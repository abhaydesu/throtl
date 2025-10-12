import { motion } from "framer-motion";

// Team member data
const teamMembers = [
  {
    name: "Abhay Singh",
    photo: "https://avatars.githubusercontent.com/u/159780692?v=4",
    github: "https://github.com/abhaydesu",
    linkedin: "https://www.linkedin.com/in/abhaydesu/",
  },
  {
    name: "Kushagra Shukla",
    photo: "https://avatars.githubusercontent.com/u/178865275?v=4",
    github: "https://github.com/kushu30",
    linkedin: "https://www.linkedin.com/in/kushu30/",
  },
  {
    name: "Yash Aggarwal",
    photo: "https://avatars.githubusercontent.com/u/134356616?v=4",
    github: "https://github.com/XploY04",
    linkedin: "https://www.linkedin.com/in/xploy04/",
  },
  {
    name: "Pushti Sonawala",
    photo: "https://avatars.githubusercontent.com/u/168925733?v=4",
    github: "https://github.com/pushtisonawala",
    linkedin: "https://www.linkedin.com/in/pushti-sonawala-b0079b27a/",
  },
];

export function TeamGrid() {
  const linkVariants = {
    initial: { y: 0 },
    hover: { y: -2, transition: { duration: 0.2 } },
  };

  return (
    <section
      className="px-6 py-16 bg-neutral-950 rounded-sm"
      aria-label="Team members"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8"
      >
        {teamMembers.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className="flex flex-col items-center text-center"
          >
            {/* Image */}
            <div className="relative mb-2">
              <a target="_blank" href={member.linkedin}>
                <img
                  src={member.photo}
                  alt={`${member.name}'s profile photo`}
                  className=" w-32 h-32 md:w-40 md:h-40 object-cover hover:shadow-neutral-200 hover:shadow-sm hover:scale-99 rounded-sm  border-5 border-white "
                />
              </a>
              <span className="absolute right-1 bottom-1 bg-white h-4 w-4"></span>
              <span className="absolute right-5 bottom-1 bg-white h-2 w-2"></span>
              <span className="absolute right-1 bottom-5 bg-white h-2 w-2"></span>
              <span className="absolute left-1 bottom-1 bg-white h-2 w-2"></span>
              <span className="absolute right-1 top-3 bg-white h-2 w-2"></span>
              <span className="absolute right-3 top-1 bg-white h-2 w-2"></span>
            </div>

            {/* Name */}
            <h3 className="text-lg font-semibold text-neutral-200">
              {member.name}
            </h3>

            {/* GitHub Link */}
            <motion.a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              variants={linkVariants}
              initial="initial"
              whileHover="hover"
              className="relative group mt-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              GitHub
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-x-0 group-hover:scale-x-100" />
            </motion.a>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
