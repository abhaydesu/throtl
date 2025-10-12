import { motion } from "framer-motion";
import { TeamGrid } from "../components/TeamGrid";

export default function Contact() {
  return (
    <div className="bg-neutral-950 text-neutral-100  my-10 max-w-7xl mx-auto px-4">
      {/* Contact Form Section */}
      <div className="flex flex-row gap-10 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl text-center border border-neutral-800 p-8 md:p-12  rounded-sm"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Get in Touch
          </h1>
          <p className="text-neutral-400 text-lg mb-10">
            Have questions, feedback, or collaboration ideas?
            <br /> We&apos;d love to hear from you.
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-6 w-full max-w-md mx-auto"
          >
            <input
              type="text"
              placeholder="Your name"
              className="bg-neutral-900 border border-neutral-800 rounded-sm p-3"
              required
            />
            <input
              type="email"
              placeholder="Your email"
              className="bg-neutral-900 border border-neutral-800 rounded-sm p-3"
              required
            />
            <textarea
              placeholder="Your message"
              rows={4}
              className="bg-neutral-900 border border-neutral-800 rounded-sm p-3 resize-none"
              required
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-white text-black font-semibold py-3 rounded-sm hover:bg-neutral-200 transition-all"
            >
              Send Message
            </motion.button>
          </form>
        </motion.div>

        {/* Team Grid Section */}
        <div className="w-full border border-neutral-800 rounded-sm">
          <TeamGrid />
        </div>
      </div>
    </div>
  );
}
