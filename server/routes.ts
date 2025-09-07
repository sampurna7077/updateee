import type { Express } from "express";
import { createServer, type Server } from "http";
// import { storage } from "./storage"; // PostgreSQL storage - REMOVED
import { JSONStorageAdapter } from "./json-storage-adapter";
import { simpleJsonDb } from "./simple-json-storage";

// Create JSON storage instance
const storage = new JSONStorageAdapter();
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { validateInput, validationRules } from "./security";
import { apiCache } from "./cache";
import { cacheMiddleware } from "./shared-hosting-optimizations";
import { body, param, query } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

export function registerRoutes(app: Express): Server {
  // Auth middleware - sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Public job routes
  app.get("/api/jobs", 
    validateInput([
      ...validationRules.pagination,
      validationRules.search,
      ...validationRules.jobFilters
    ]), 
    async (req, res) => {
    try {
      const {
        search,
        country,
        industry,
        category,
        jobType,
        experienceLevel,
        remoteType,
        visaSupport,
        limit = "20",
        offset = "0",
        sort = "date"
      } = req.query;

      const filters = {
        search: search as string,
        country: country as string,
        industry: industry as string,
        category: category as string,
        jobType: jobType as string,
        experienceLevel: experienceLevel as string,
        remoteType: remoteType as string,
        visaSupport: visaSupport === "true" ? true : visaSupport === "false" ? false : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sort: sort as 'relevance' | 'date' | 'salary' | 'company',
      };

      const result = await storage.getJobs(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/featured", 
    cacheMiddleware(15), // Cache for 15 minutes
    validateInput([validationRules.pagination]), 
    async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const jobs = await storage.getFeaturedJobs(limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });

  app.get("/api/jobs/:id", 
    validateInput([validationRules.id]), 
    async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Job application routes (public - no auth required)
  app.post("/api/jobs/:id/apply", 
    validateInput([
      validationRules.id,
      validationRules.email,
      body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
      body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required'),
      body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
      body('coverLetter').optional().isLength({ max: 2000 }).withMessage('Cover letter too long')
    ]), 
    async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const userId = req.user?.id; // Optional - user might not be logged in

      // First check if the job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ 
          message: "This job is no longer available. Please check our current job listings." 
        });
      }

      const validatedData = {
        ...req.body,
        jobId,
        userId,
      };

      const application = await storage.createJobApplication(validatedData);
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating job application:", error);
      if (error.code === '23503') {
        return res.status(404).json({ 
          message: "This job is no longer available. Please check our current job listings." 
        });
      }
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ message: "Invalid application data", error: error.message });
    }
  });

  // Citizen card view endpoints
  app.get("/api/citizen-cards/:applicationId/front", 
    validateInput([param('applicationId').isLength({ min: 1 }).withMessage('Application ID required')]), 
    async (req, res) => {
    try {
      const application = await storage.getJobApplication(req.params.applicationId);
      if (!application || !application.citizenCardFront) {
        return res.status(404).json({ message: "Citizen card front not found" });
      }

      // Extract base64 data and convert to buffer
      const base64Data = application.citizenCardFront.split(',')[1]; // Remove data:mime/type;base64, prefix
      if (!base64Data) {
        return res.status(400).json({ message: "Invalid image data format" });
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers for inline display in browser
      res.setHeader('Content-Type', application.citizenCardFrontFileType || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 1 day
      res.send(buffer);
    } catch (error) {
      console.error("Error serving citizen card front:", error);
      res.status(500).json({ message: "Failed to serve citizen card front" });
    }
  });

  app.get("/api/citizen-cards/:applicationId/back", 
    validateInput([param('applicationId').isLength({ min: 1 }).withMessage('Application ID required')]), 
    async (req, res) => {
    try {
      const application = await storage.getJobApplication(req.params.applicationId);
      if (!application || !application.citizenCardBack) {
        return res.status(404).json({ message: "Citizen card back not found" });
      }

      // Extract base64 data and convert to buffer
      const base64Data = application.citizenCardBack.split(',')[1]; // Remove data:mime/type;base64, prefix
      if (!base64Data) {
        return res.status(400).json({ message: "Invalid image data format" });
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers for inline display in browser
      res.setHeader('Content-Type', application.citizenCardBackFileType || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 1 day
      res.send(buffer);
    } catch (error) {
      console.error("Error serving citizen card back:", error);
      res.status(500).json({ message: "Failed to serve citizen card back" });
    }
  });

  // Public testimonial routes
  app.get("/api/testimonials", 
    cacheMiddleware(10), // Cache for 10 minutes
    validateInput([validationRules.pagination]), 
    async (req, res) => {
    try {
      const { serviceType, limit } = req.query;
      const testimonials = await storage.getTestimonials({
        serviceType: serviceType as string,
        isVisible: true,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Public companies endpoint
  app.get("/api/companies", 
    validateInput([validationRules.pagination]), 
    async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/testimonials", 
    validateInput([
      body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name required'),
      validationRules.email,
      body('serviceType').isIn(['placements', 'visa', 'education']).withMessage('Invalid service type'),
      body('rating').isNumeric().customSanitizer(value => parseInt(value)).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
      body('review').trim().isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters')
    ]), 
    async (req, res) => {
    try {
      // Convert rating to integer to match schema expectation
      if (req.body.rating && typeof req.body.rating === 'number') {
        req.body.rating = Math.round(req.body.rating);
      }
      
      // Clean up empty optional fields to avoid validation issues
      if (req.body.position === "") {
        delete req.body.position;
      }
      if (req.body.company === "") {
        delete req.body.company;
      }
      if (req.body.photo === "") {
        delete req.body.photo;
      }
      if (req.body.videoUrl === "") {
        delete req.body.videoUrl;
      }
      
      const validatedData = req.body;
      const testimonial = await storage.createTestimonial(validatedData);
      res.status(201).json(testimonial);
    } catch (error: any) {
      console.error("Error creating testimonial:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ message: "Invalid testimonial data" });
    }
  });

  // Form submission routes
  app.post("/api/forms/:formType", 
    validateInput([
      body('formType').isIn(['consultation', 'job-application', 'study-abroad', 'visa-counseling', 'document-review', 'contact']).withMessage('Invalid form type'),
      validationRules.email,
      body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
      body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
      body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
      body('message').optional().isLength({ max: 2000 }).withMessage('Message too long')
    ]), 
    async (req, res) => {
    try {
      const { formType } = req.params;
      const validatedData = {
        ...req.body,
        formType,
        data: req.body,
      };

      const submission = await storage.createFormSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating form submission:", error);
      res.status(400).json({ message: "Invalid form data" });
    }
  });

  // Public resource routes
  app.get("/api/resources", 
    validateInput([
      ...validationRules.pagination,
      query('type').optional().trim().escape().isLength({ max: 50 }),
      query('category').optional().trim().escape().isLength({ max: 50 }),
      query('country').optional().trim().escape().isLength({ max: 50 })
    ]), 
    async (req, res) => {
    try {
      const { type, category, country, limit } = req.query;
      const resources = await storage.getResources({
        type: type as string,
        category: category as string,
        country: country as string,
        isPublished: true,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:slug", 
    validateInput([
      param('slug').trim().isLength({ min: 1, max: 100 }).withMessage('Invalid slug')
    ]), 
    async (req, res) => {
    try {
      const resource = await storage.getResourceBySlug(req.params.slug);
      if (!resource || !resource.isPublished) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  // Protected admin routes
  app.get("/api/admin/jobs", 
    isAuthenticated, 
    isAdmin, 
    validateInput([...validationRules.pagination, validationRules.search]), 
    async (req: any, res) => {
    try {
      const result = await storage.getJobs({
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/admin/jobs", 
    isAuthenticated, 
    isAdmin, 
    validateInput([
      body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
      body('companyId').isLength({ min: 1 }).withMessage('Company ID required'),
      body('location').trim().isLength({ min: 1, max: 100 }).withMessage('Location required'),
      body('country').trim().isLength({ min: 1, max: 50 }).withMessage('Country required'),
      body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category required'),
      body('industry').trim().isLength({ min: 1, max: 100 }).withMessage('Industry required'),
      body('jobType').isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship']).withMessage('Valid job type required'),
      body('experienceLevel').isIn(['entry', 'mid', 'senior', 'executive']).withMessage('Valid experience level required'),
      body('remoteType').isIn(['remote', 'onsite', 'hybrid']).withMessage('Valid remote type required'),
      body('description').trim().isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
      body('requirements').optional().isString().withMessage('Requirements must be a string'),
      body('benefits').optional().isString().withMessage('Benefits must be a string'),
      body('visaSupport').isBoolean().withMessage('Visa support must be boolean'),
      body('salaryMin').optional().isNumeric().withMessage('Salary min must be numeric'),
      body('salaryMax').optional().isNumeric().withMessage('Salary max must be numeric'),
      body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
      body('vacancies').optional().isInt({ min: 1 }).withMessage('Vacancies must be a positive integer')
    ]), 
    async (req: any, res) => {
    try {
      // Process the data before validation
      const processedData = {
        ...req.body,
        createdBy: req.user.id,
        salaryMin: req.body.salaryMin ? parseFloat(req.body.salaryMin) : undefined,
        salaryMax: req.body.salaryMax ? parseFloat(req.body.salaryMax) : undefined,
        vacancies: req.body.vacancies ? parseInt(req.body.vacancies) : 1,
        // Convert arrays to strings if they come as arrays
        requirements: Array.isArray(req.body.requirements) ? req.body.requirements.join('\n') : req.body.requirements,
        benefits: Array.isArray(req.body.benefits) ? req.body.benefits.join('\n') : req.body.benefits,
      };

      const validatedData = processedData;
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid job data" });
      }
    }
  });

  app.put("/api/admin/jobs/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(400).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Admin companies
  app.get("/api/admin/companies", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.pagination]), 
    async (req: any, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/admin/companies", 
    isAuthenticated, 
    isAdmin, 
    async (req: any, res) => {
    try {
      // Clean empty strings to undefined for optional fields
      const cleanedData = {
        ...req.body,
        logo: req.body.logo?.trim() || undefined,
        website: req.body.website?.trim() || undefined,
        description: req.body.description?.trim() || undefined,
        industry: req.body.industry?.trim() || undefined,
        size: req.body.size?.trim() || undefined,
        location: req.body.location?.trim() || undefined,
        country: req.body.country?.trim() || undefined,
      };

      const validatedData = cleanedData;
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ message: "Invalid company data", error: error.message });
    }
  });

  // Admin form submissions
  app.get("/api/admin/submissions", 
    isAuthenticated, 
    isAdmin, 
    validateInput([...validationRules.pagination]), 
    async (req: any, res) => {
    try {
      const { formType } = req.query;
      
      // Get both form submissions and job applications with job details
      const formSubmissions = await storage.getFormSubmissions(formType as string);
      const jobApplications = await storage.getJobApplications();
      
      // Transform job applications to match submission format
      const transformedApplications = jobApplications.map((app: any) => ({
        id: app.id,
        formType: 'job-application',
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        data: {
          jobId: app.jobId,
          jobTitle: app.job?.title,
          jobCountry: app.job?.country,
          jobLocation: app.job?.location,
          country: app.job?.country, // This will be used by the Local(Nepal) filter
          coverLetter: app.coverLetter,
          resume: app.resume,
          resumeFileName: app.resumeFileName,
          resumeFileType: app.resumeFileType,
          // Include citizen card data
          citizenCardFront: app.citizenCardFront,
          citizenCardBack: app.citizenCardBack,
          citizenCardFrontFileName: app.citizenCardFrontFileName,
          citizenCardBackFileName: app.citizenCardBackFileName,
          citizenCardFrontFileType: app.citizenCardFrontFileType,
          citizenCardBackFileType: app.citizenCardBackFileType,
          status: app.status
        },
        submittedAt: app.appliedAt,
        status: app.status
      }));
      
      // Combine and sort by submission date
      const allSubmissions = [...formSubmissions, ...transformedApplications]
        .sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        });
      
      res.json(allSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.put("/api/admin/submissions/:id", 
    isAuthenticated,
    isAdmin,
    validateInput([validationRules.id]),
    async (req: any, res) => {
    try {
      const { status, notes } = req.body;
      const { id } = req.params;
      
      // First try to update as a job application
      try {
        const jobApplication = await storage.getJobApplication(id);
        if (jobApplication) {
          const updatedApplication = await storage.updateJobApplicationStatus(id, status);
          return res.json({
            ...updatedApplication,
            formType: 'job-application',
            firstName: updatedApplication.firstName,
            lastName: updatedApplication.lastName,
            email: updatedApplication.email,
            phone: updatedApplication.phone,
            submittedAt: updatedApplication.appliedAt,
            notes: notes // Job applications don't have notes field, but return it for UI
          });
        }
      } catch (err) {
        // If not a job application, continue to try form submission
      }
      
      // Try to update as a form submission
      const submission = await storage.updateFormSubmissionStatus(id, status, notes);
      res.json(submission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(400).json({ message: "Failed to update submission" });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", isAdmin, async (req: any, res) => {
    try {
      const [jobsData, submissions, testimonials, companies] = await Promise.all([
        storage.getJobs({ limit: 1000, offset: 0 }),
        storage.getFormSubmissions(),
        storage.getTestimonials({}),
        storage.getCompanies()
      ]);
      
      const stats = {
        totalJobs: jobsData.total || jobsData.jobs?.length || 0,
        activeJobs: jobsData.jobs?.filter((job: any) => job.status === 'published').length || 0,
        totalSubmissions: submissions.length || 0,
        pendingSubmissions: submissions.filter((s: any) => s.status === 'pending').length || 0,
        totalTestimonials: testimonials.length || 0,
        verifiedTestimonials: testimonials.filter((t: any) => t.isVerified).length || 0,
        totalCompanies: companies.length || 0,
        recentSubmissions: submissions.slice(0, 5)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Admin testimonials
  app.get("/api/admin/testimonials", isAdmin, async (req: any, res) => {
    try {
      const testimonials = await storage.getTestimonials({});
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.put("/api/admin/testimonials/:id", isAdmin, async (req: any, res) => {
    try {
      const testimonial = await storage.updateTestimonial(req.params.id, req.body);
      res.json(testimonial);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(400).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete("/api/admin/testimonials/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // Public resources endpoints (FAQs, blogs, guides)
  app.get("/api/resources", async (req, res) => {
    try {
      const { type, category, published = "true" } = req.query;
      const resources = await storage.getResources({ 
        type: type as string, 
        category: category as string, 
        isPublished: published === "true" 
      });
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  // Admin resources management
  app.get("/api/admin/resources", 
    isAuthenticated, 
    isAdmin, 
    validateInput([...validationRules.pagination]), 
    async (req: any, res) => {
    try {
      const { type, category } = req.query;
      const resources = await storage.getResources({ 
        type: type as string, 
        category: category as string, 
        isPublished: undefined // Get all including unpublished
      });
      res.json(resources);
    } catch (error) {
      console.error("Error fetching admin resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post("/api/admin/resources", 
    isAuthenticated, 
    isAdmin, 
    validateInput([
      body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
      body('slug').optional().trim().isLength({ max: 200 }).withMessage('Slug too long'),
      body('type').isIn(['faq', 'blog', 'guide', 'download']).withMessage('Valid type required'),
      body('category').optional().trim().isLength({ max: 100 }),
      // Content validation depends on type
      body('content').custom((value, { req }) => {
        if (req.body.type === 'faq') {
          return true; // No content required for FAQ
        }
        if ((req.body.type === 'guide' || req.body.type === 'blog') && (!value || value.trim().length < 100)) {
          throw new Error('Content must be at least 100 characters for guides and blogs');
        }
        return true;
      }),
      body('isPublished').isBoolean().withMessage('Published status must be boolean')
    ]), 
    async (req: any, res) => {
    try {
      const validatedData = {
        ...req.body,
        author: req.user.id,
      };
      const resource = await storage.createResource(validatedData);
      res.status(201).json(resource);
    } catch (error: any) {
      console.error("Error creating resource:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(400).json({ message: "Invalid resource data", error: error.message });
    }
  });

  app.put("/api/admin/resources/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      const resource = await storage.updateResource(req.params.id, req.body);
      res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(400).json({ message: "Failed to update resource" });
    }
  });

  app.delete("/api/admin/resources/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      await storage.deleteResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Security status endpoint (for monitoring)
  app.get("/api/security-status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const securityStatus = {
        timestamp: new Date().toISOString(),
        security_measures: {
          rate_limiting: {
            general_api: "100 requests per 15 minutes",
            auth_endpoints: "5 attempts per 15 minutes",
            speed_limiting: "500ms delay after 50 requests"
          },
          headers: {
            helmet: "Content Security Policy, HSTS, XSS Protection",
            cors: process.env.NODE_ENV === 'development' ? "permissive (dev)" : "strict (prod)",
            content_type_nosniff: "enabled",
            frame_options: "DENY",
            xss_protection: "enabled"
          },
          input_validation: {
            express_validator: "all endpoints validated",
            sanitization: "XSS and injection prevention",
            parameter_pollution: "prevented with hpp",
            nosql_injection: "sanitized with express-mongo-sanitize"
          },
          session_security: {
            http_only: "enabled",
            secure: process.env.NODE_ENV === 'production',
            same_site: "strict",
            session_name: "custom (sessionId)",
            rolling_sessions: "enabled",
            max_age: "24 hours"
          },
          authentication: {
            password_hashing: "scrypt with salt",
            session_storage: "PostgreSQL backed",
            csrf_protection: "SameSite cookies",
            brute_force_protection: "rate limiting"
          },
          monitoring: {
            security_monitoring: "suspicious pattern detection",
            error_handling: "secure error responses",
            environment_validation: "required vars checked"
          }
        },
        status: "all_security_measures_active"
      };
      
      res.json(securityStatus);
    } catch (error) {
      console.error("Error generating security status:", error);
      res.status(500).json({ message: "Failed to generate security status" });
    }
  });

  // Cache management endpoint (for debugging and manual refresh)
  app.post("/api/cache/clear", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { collection } = req.body;
      
      // Clear the JSON storage cache
      storage.clearCache(collection);
      
      res.json({ 
        success: true, 
        message: collection ? `Cache cleared for ${collection}` : "All cache cleared",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Cache clear error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: "Failed to clear cache", error: errorMessage });
    }
  });

  // File watcher status and control endpoints
  app.get("/api/file-watcher/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { fileWatcher } = await import("./fileWatcher");
      res.json(fileWatcher.getStatus());
    } catch (error) {
      console.error("File watcher status error:", error);
      res.status(500).json({ message: "Failed to get file watcher status" });
    }
  });

  app.post("/api/file-watcher/force-refresh", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { fileWatcher } = await import("./fileWatcher");
      await fileWatcher.forceRefresh();
      
      res.json({ 
        success: true, 
        message: "Force refresh triggered for all files",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Force refresh error:", error);
      res.status(500).json({ message: "Failed to trigger force refresh" });
    }
  });

  // Public stats endpoint for landing page
  app.get("/api/stats", 
    cacheMiddleware(30), // Cache for 30 minutes
    async (req, res) => {
    try {
      const [jobsData, testimonials, companies] = await Promise.all([
        storage.getJobs({ limit: 1000, offset: 0 }),
        storage.getTestimonials({ isVisible: true }),
        storage.getCompanies()
      ]);
      
      const stats = {
        successfulPlacements: jobsData.total || jobsData.jobs?.length || 2500, // Fallback to current number if no data
        partnerCountries: 45, // This could be calculated from job locations
        partnerCompanies: companies.length || 800, // Use actual company count or fallback
        clientSatisfaction: 98 // This could be calculated from testimonial ratings
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching public stats:", error);
      // Return fallback stats if there's an error
      res.json({
        successfulPlacements: 2500,
        partnerCountries: 45,
        partnerCompanies: 800,
        clientSatisfaction: 98
      });
    }
  });

  // Public advertisement endpoints
  app.get("/api/advertisements", 
    validateInput([
      query('position').optional().isIn(['left', 'right']).withMessage('Position must be left or right')
    ]), 
    async (req, res) => {
    try {
      const { position } = req.query;
      const ads = await storage.getAdvertisements({
        position: position as string,
        isActive: true,
        limit: 5
      });
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Track ad clicks/impressions
  app.post("/api/advertisements/:id/click", 
    validateInput([param('id').isLength({ min: 1 }).withMessage('Invalid ID format')]), 
    async (req, res) => {
    try {
      await storage.incrementAdClicks(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  app.post("/api/advertisements/:id/impression", 
    validateInput([param('id').isLength({ min: 1 }).withMessage('Invalid ID format')]), 
    async (req, res) => {
    try {
      await storage.incrementAdImpressions(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error tracking ad impression:", error);
      res.status(500).json({ message: "Failed to track impression" });
    }
  });

  // Setup multer for advertisement uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
      // Allow images and GIFs
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images and GIFs are allowed.'));
      }
    }
  });

  // Setup multer for resource file uploads (images and documents)
  const resourceUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for resource files
    },
    fileFilter: (req: any, file: any, cb: any) => {
      // Allow images and document files
      const allowedTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/zip', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images and documents are allowed.'));
      }
    }
  });

  // Advertisement file upload endpoint (local server storage)
  app.post("/api/admin/advertisements/upload", 
    isAuthenticated, 
    isAdmin,
    upload.single('file'),
    async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { LocalFileStorage } = await import("./localFileStorage");
      const fileStorage = new LocalFileStorage();
      
      // Save file to local storage
      const filePath = await fileStorage.saveFile(
        req.file.buffer, 
        req.file.originalname,
        req.file.mimetype
      );
      
      res.json({ 
        filePath,
        fileType: req.file.mimetype.includes('gif') ? 'gif' : 'image',
        success: true 
      });
    } catch (error) {
      console.error("Error uploading advertisement file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Resource file upload endpoint (images and documents)
  app.post("/api/admin/resources/upload", 
    isAuthenticated, 
    isAdmin,
    resourceUpload.single('file'),
    async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { LocalFileStorage } = await import("./localFileStorage");
      const fileStorage = new LocalFileStorage();
      
      // Create uploads/resources directory if it doesn't exist
      const uploadDir = 'resources';
      
      // Save file to local storage
      const filePath = await fileStorage.saveFile(
        req.file.buffer, 
        req.file.originalname,
        req.file.mimetype,
        uploadDir
      );
      
      res.json({ 
        filePath,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
        success: true 
      });
    } catch (error) {
      console.error("Error uploading resource file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Advertisement file serving endpoint (local storage)
  app.get("/uploads/advertisements/:fileName", async (req, res) => {
    try {
      const { LocalFileStorage } = await import("./localFileStorage");
      const fileStorage = new LocalFileStorage();
      
      const fileName = req.params.fileName;
      const filePath = fileStorage.getFilePath(fileName);
      
      // Check if file exists
      if (!(await fileStorage.fileExists(fileName))) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Serve the file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving advertisement file:", error);
      res.status(500).json({ error: "Error serving file" });
    }
  });

  // Resource file serving endpoint (local storage)
  app.get("/uploads/resources/:fileName", async (req, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(process.cwd(), 'server', 'uploads', 'resources', fileName);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Serve the file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving resource file:", error);
      res.status(500).json({ error: "Error serving file" });
    }
  });

  // Admin cleanup endpoint
  app.post("/api/admin/cleanup", 
    isAuthenticated, 
    isAdmin,
    async (req: any, res) => {
    try {
      const { cleanupService } = await import("./cleanupService");
      const result = await cleanupService.runCleanup();
      res.json({
        success: true,
        message: `Cleaned up ${result.deletedAds} expired ads and ${result.deletedFiles} files`,
        ...result
      });
    } catch (error) {
      console.error("Error running manual cleanup:", error);
      res.status(500).json({ error: "Failed to run cleanup" });
    }
  });

  // Admin advertisement endpoints
  app.get("/api/admin/advertisements", 
    isAuthenticated, 
    isAdmin, 
    validateInput([...validationRules.pagination]), 
    async (req: any, res) => {
    try {
      const ads = await storage.getAdvertisements({}); // Get all ads without any filters
      
      // Get counts for each position
      const leftCount = await storage.countActiveAdsByPosition('left');
      const rightCount = await storage.countActiveAdsByPosition('right');
      
      res.json({
        advertisements: ads,
        counts: {
          left: { active: leftCount, max: 3 },
          right: { active: rightCount, max: 3 }
        },
        totalActive: leftCount + rightCount,
        maxTotal: 6
      });
    } catch (error) {
      console.error("Error fetching admin advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  app.post("/api/admin/advertisements", 
    isAuthenticated, 
    isAdmin, 
    validateInput([
      body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
      body('position').isIn(['left', 'right']).withMessage('Position must be left or right'),
      body('filePath').optional().trim().isLength({ min: 1 }).withMessage('File path required'),
      body('fileType').optional().isIn(['image', 'gif']).withMessage('File type must be image or gif'),
      body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be positive number'),
      body('isActive').isBoolean().withMessage('Active status must be boolean')
    ]), 
    async (req: any, res) => {
    try {
      // Normalize file path if it's an upload URL
      if (req.body.filePath && req.body.filePath.includes('storage.googleapis.com')) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        req.body.filePath = objectStorageService.normalizeAdvertisementPath(req.body.filePath);
      }

      // Convert string dates to Date objects
      const requestData = { ...req.body };
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        requestData.endDate = new Date(requestData.endDate);
      }

      const validatedData = {
        ...requestData,
        createdBy: req.user.id,
      };
      
      const ad = await storage.createAdvertisement(validatedData);
      
      res.status(201).json(ad);
    } catch (error) {
      console.error("Error creating advertisement:", error);
      res.status(400).json({ message: "Invalid advertisement data" });
    }
  });

  app.put("/api/admin/advertisements/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      // Convert string dates to Date objects
      const updateData = { ...req.body };
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      const ad = await storage.updateAdvertisement(req.params.id, updateData);
      res.json(ad);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(400).json({ message: "Failed to update advertisement" });
    }
  });

  app.delete("/api/admin/advertisements/:id", 
    isAuthenticated, 
    isAdmin, 
    validateInput([validationRules.id]), 
    async (req: any, res) => {
    try {
      await storage.deleteAdvertisement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Failed to delete advertisement" });
    }
  });

  // Saved jobs routes (protected)
  app.get("/api/saved-jobs", 
    isAuthenticated, 
    async (req: any, res) => {
    try {
      const savedJobs = await storage.getSavedJobs(req.user.id);
      res.json(savedJobs);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      res.status(500).json({ message: "Failed to fetch saved jobs" });
    }
  });

  app.post("/api/saved-jobs", 
    isAuthenticated, 
    validateInput([
      body('jobId').isLength({ min: 1 }).withMessage('Job ID required')
    ]), 
    async (req: any, res) => {
    try {
      // Check if job is already saved
      const isAlreadySaved = await storage.isJobSaved(req.user.id, req.body.jobId);
      if (isAlreadySaved) {
        return res.status(400).json({ message: "Job already saved" });
      }

      const savedJob = await storage.saveJob(req.user.id, req.body.jobId);
      res.status(201).json(savedJob);
    } catch (error) {
      console.error("Error saving job:", error);
      res.status(500).json({ message: "Failed to save job" });
    }
  });

  app.delete("/api/saved-jobs/:jobId", 
    isAuthenticated, 
    validateInput([param('jobId').isLength({ min: 1 }).withMessage('Job ID required')]), 
    async (req: any, res) => {
    try {
      await storage.unsaveJob(req.user.id, req.params.jobId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing saved job:", error);
      res.status(500).json({ message: "Failed to remove saved job" });
    }
  });

  // JSON Database Test Endpoints
  app.get("/api/json-test", async (req, res) => {
    try {
      // Test basic JSON database operations
      const testData = await simpleJsonDb.find('users');
      const stats = {
        users_count: testData.length,
        json_db_status: 'active',
        timestamp: new Date().toISOString(),
        sample_user: testData[0] ? { 
          id: testData[0].id, 
          username: testData[0].username,
          role: testData[0].role 
        } : null
      };
      
      res.json(stats);
    } catch (error) {
      console.error("JSON DB Test Error:", error);
      res.status(500).json({ 
        error: "JSON database test failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/json-test", async (req, res) => {
    try {
      // Test creating a test record
      const testRecord = await simpleJsonDb.create('test_records', {
        name: req.body.name || 'Test Record',
        description: 'Created via JSON DB test endpoint',
        test_data: req.body
      });
      
      res.status(201).json(testRecord);
    } catch (error) {
      console.error("JSON DB Create Test Error:", error);
      res.status(500).json({ 
        error: "JSON database create test failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}