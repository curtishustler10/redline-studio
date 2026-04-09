"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Dragos Duta",
    date: "March 1, 2025",
    rating: 5,
    text: "Thanks to Redline Studio's acquisition system, we went from $0 to $4,000/month right from our launch. Curtis listens closely and tailors solutions exactly to our needs. Highly recommended.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Valentina Dodaj",
    date: "September 10, 2024",
    rating: 5,
    text: "Superb experience with Redline Studio. They bring ideas and expertise to help you build a high-quality site. Their ongoing marketing support genuinely boosts your visibility.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Sarah Johnson",
    date: "January 15, 2025",
    rating: 5,
    text: "Redline Studio transformed our online presence. Our conversion rate increased by 250% within the first month. Exceptional work and ongoing support.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What clients say
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            From people we've actually worked with.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-red-600/50 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-red-500/30" />
                </div>

                <p className="text-slate-300 mb-6 leading-relaxed">"{testimonial.text}"</p>

                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-slate-400 text-sm">{testimonial.date}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-full px-6 py-3">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-slate-300 text-sm">5/5 from 50+ reviews</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
