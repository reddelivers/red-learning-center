/*
# Seed training catalog with sample modules

1. Inserts sample modules across four sections: Onboarding, Product Knowledge, Safety, and Customer Service.
   Mix of video and document types with realistic content URLs and durations.
2. No schema changes.
3. Idempotent: only inserts titles that do not already exist.
*/

INSERT INTO modules (section, title, description, type, content_url, duration_minutes, order_index)
SELECT * FROM (VALUES
  ('Onboarding', 'Welcome to the Team', 'A brief introduction to our company mission, values, and what to expect in your first weeks.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 8, 1),
  ('Onboarding', 'Company Handbook', 'The full employee handbook covering policies, benefits, conduct, and workplace expectations.', 'document', 'https://www.africau.edu/images/default/sample.pdf', 20, 2),
  ('Onboarding', 'Setting Up Your Workspace', 'How to configure your laptop, accounts, and tools on day one.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 6, 3),
  ('Product Knowledge', 'Product Overview', 'A walkthrough of our core product line and the problems each one solves for customers.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 12, 1),
  ('Product Knowledge', 'Feature Deep Dive', 'Detailed reference document covering every major feature, configuration options, and common use cases.', 'document', 'https://www.africau.edu/images/default/sample.pdf', 35, 2),
  ('Product Knowledge', 'Pricing and Plans', 'How our pricing tiers work and how to explain them to customers.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 9, 3),
  ('Safety', 'Workplace Safety Basics', 'Required safety training covering hazards, ergonomics, and emergency procedures.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 15, 1),
  ('Safety', 'Emergency Procedures Guide', 'Reference document on evacuation routes, assembly points, and incident reporting.', 'document', 'https://www.africau.edu/images/default/sample.pdf', 10, 2),
  ('Customer Service', 'Handling Difficult Conversations', 'Techniques for de-escalating tense situations and turning frustrated customers into happy ones.', 'video', 'https://www.youtube.com/embed/ScMzIvxBSi4', 14, 1),
  ('Customer Service', 'Communication Standards', 'Our tone, response time, and follow-up standards for every customer interaction.', 'document', 'https://www.africau.edu/images/default/sample.pdf', 12, 2)
) AS v(section, title, description, type, content_url, duration_minutes, order_index)
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.title = v.title);
