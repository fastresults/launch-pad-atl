import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AskConcierge } from "@/components/site/AskConcierge";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { LandingOnlyGate } from "@/components/site/LandingOnlyGate";
import { LandingOnlyBanner } from "@/components/admin/LandingOnlyBanner";

// Layout guards
import AuthenticatedLayout from "@/routes/_authenticated";
import AdminLayout from "@/routes/_authenticated/_admin";

// Public pages
const HomePage = lazy(() => import("@/routes/index"));
const SchedulePage = lazy(() => import("@/routes/schedule"));
const CalendarPage = lazy(() => import("@/routes/calendar"));
const RegisterPage = lazy(() => import("@/routes/register"));
const ServicesPage = lazy(() => import("@/routes/services"));
const BuildIndexPage = lazy(() => import("@/routes/build"));
const BuildWorkshopPage = lazy(() => import("@/routes/build.$slug"));
const FacilitatorPage = lazy(() => import("@/routes/facilitator"));
const ContactPage = lazy(() => import("@/routes/contact"));
const LoginPage = lazy(() => import("@/routes/login"));
const SignupPage = lazy(() => import("@/routes/signup"));
const ResetPasswordPage = lazy(() => import("@/routes/reset-password"));
const PrivacyPage = lazy(() => import("@/routes/privacy"));
const TermsPage = lazy(() => import("@/routes/terms"));
const UnsubscribePage = lazy(() => import("@/routes/unsubscribe"));
const WebinarPage = lazy(() => import("@/routes/webinar"));
const OneOnOnePage = lazy(() => import("@/routes/one-on-one"));
const PrivateTuesdayPage = lazy(() => import("@/routes/private-tuesday"));

// Authenticated pages
const WelcomePage = lazy(() => import("@/routes/_authenticated/welcome"));
const PausedPage = lazy(() => import("@/routes/_authenticated/paused"));

// Dashboard layout + sub-pages
const DashboardLayout = lazy(() => import("@/routes/_authenticated/dashboard"));
const DashboardIndex = lazy(() => import("@/routes/_authenticated/dashboard/index"));
const DashboardBrief = lazy(() => import("@/routes/_authenticated/dashboard/brief"));
const DashboardDay = lazy(() => import("@/routes/_authenticated/dashboard/day"));
const DashboardDeliverables = lazy(() => import("@/routes/_authenticated/dashboard/deliverables"));
const DashboardDocuments = lazy(() => import("@/routes/_authenticated/dashboard/documents"));
const DashboardFiles = lazy(() => import("@/routes/_authenticated/dashboard/files"));
const DashboardFiling = lazy(() => import("@/routes/_authenticated/dashboard/filing"));
const DashboardGoals = lazy(() => import("@/routes/_authenticated/dashboard/goals"));
const DashboardMedia = lazy(() => import("@/routes/_authenticated/dashboard/media"));
const DashboardProfile = lazy(() => import("@/routes/_authenticated/dashboard/profile"));
const DashboardWorkflow = lazy(() => import("@/routes/_authenticated/dashboard/workflow"));
const DashboardWorkflowKey = lazy(() => import("@/routes/_authenticated/dashboard/workflow.$key"));
const DashboardLegalSetup = lazy(() => import("@/routes/_authenticated/dashboard/legal-setup"));
const DashboardBrain = lazy(() => import("@/routes/_authenticated/dashboard/brain"));
const HubLibrary = lazy(() => import("@/routes/_authenticated/dashboard/hub.index"));
const HubNew = lazy(() => import("@/routes/_authenticated/dashboard/hub.new"));
const HubSnapshot = lazy(() => import("@/routes/_authenticated/dashboard/hub.$snapshotId"));
const WorkshopStage = lazy(() => import("@/routes/_authenticated/workshop.$stage"));


// Admin sub-pages
const AdminIndex = lazy(() => import("@/routes/_authenticated/_admin/admin.index"));
const AdminUsers = lazy(() => import("@/routes/_authenticated/_admin/admin.users"));
const AdminSettings = lazy(() => import("@/routes/_authenticated/_admin/admin.settings"));
const AdminDecks = lazy(() => import("@/routes/_authenticated/_admin/admin.decks"));
const AdminDeckEditor = lazy(() => import("@/routes/_authenticated/_admin/admin.decks.$slug"));

const AdminReview = lazy(() => import("@/routes/_authenticated/_admin/admin.review"));
const AdminRegistrations = lazy(() => import("@/routes/_authenticated/_admin/admin.registrations"));
const AdminPrivateSessions = lazy(() => import("@/routes/_authenticated/_admin/admin.private-sessions"));
const AdminMembers = lazy(() => import("@/routes/_authenticated/_admin/admin.members"));
const AdminMembersUserView = lazy(() => import("@/routes/_authenticated/_admin/admin.members.$userId.view"));
const AdminHub = lazy(() => import("@/routes/_authenticated/_admin/admin.hub"));

const AdminMedia = lazy(() => import("@/routes/_authenticated/_admin/admin.media"));
const AdminTestimonials = lazy(() => import("@/routes/_authenticated/_admin/admin.testimonials"));
const AdminVideoWall = lazy(() => import("@/routes/_authenticated/_admin/admin.video-wall"));
const AdminHeroImages = lazy(() => import("@/routes/_authenticated/_admin/admin.hero-images"));
const AdminAudits = lazy(() => import("@/routes/_authenticated/_admin/admin.audits"));
const WorkshopAuditPage = lazy(() => import("@/routes/_authenticated/audit.$slug"));
const NotFoundPage = lazy(() => import("@/routes/not-found"));
const AdminCohorts = lazy(() => import("@/routes/_authenticated/_admin/admin.cohorts"));

const AdminAttendees = lazy(() => import("@/routes/_authenticated/_admin/admin.attendees"));
const AdminAttendeesUserIndex = lazy(() => import("@/routes/_authenticated/_admin/admin.attendees.$userId.index"));
const AdminAttendeesUserWorkflow = lazy(() => import("@/routes/_authenticated/_admin/admin.attendees.$userId.workflow"));
const AdminAttendeesUserMedia = lazy(() => import("@/routes/_authenticated/_admin/admin.attendees.$userId.media"));
const AdminAttendeesUserDeliverables = lazy(() => import("@/routes/_authenticated/_admin/admin.attendees.$userId.deliverables.$key"));
const AdminApplicationsIndex = lazy(() => import("@/routes/_authenticated/_admin/admin.applications.index"));
const AdminApplicationsId = lazy(() => import("@/routes/_authenticated/_admin/admin.applications.$id"));
const AdminInquiriesIndex = lazy(() => import("@/routes/_authenticated/_admin/admin.inquiries.index"));
const AdminInquiriesId = lazy(() => import("@/routes/_authenticated/_admin/admin.inquiries.$id"));
const AdminSocialIndex = lazy(() => import("@/routes/_authenticated/_admin/admin.social"));
const AdminSocialAccounts = lazy(() => import("@/routes/_authenticated/_admin/admin.social.accounts"));
const AdminSocialCompose = lazy(() => import("@/routes/_authenticated/_admin/admin.social.compose"));
const AdminSocialPosts = lazy(() => import("@/routes/_authenticated/_admin/admin.social.posts"));
const AdminSocialAnalytics = lazy(() => import("@/routes/_authenticated/_admin/admin.social.analytics"));
const AdminSocialSetup = lazy(() => import("@/routes/_authenticated/_admin/admin.social.setup"));
const AdminSocialSetupPlatform = lazy(() => import("@/routes/_authenticated/_admin/admin.social.setup.$platform"));
const AdminSocialSetupIntake = lazy(() => import("@/routes/_authenticated/_admin/admin.social.setup.intake"));
const AdminSocialSetupCreative = lazy(() => import("@/routes/_authenticated/_admin/admin.social.setup.creative"));
const AdminSocialSetupCreativeAsset = lazy(() => import("@/routes/_authenticated/_admin/admin.social.setup.creative.$assetType"));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Loading…</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmProvider>
      <ScrollToTop />
      <LandingOnlyBanner />
      <LandingOnlyGate>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/build" element={<BuildIndexPage />} />
        <Route path="/build/:slug" element={<BuildWorkshopPage />} />
        <Route path="/facilitator" element={<FacilitatorPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/webinar" element={<WebinarPage />} />
        <Route path="/one-on-one" element={<OneOnOnePage />} />
        <Route path="/private-tuesday" element={<PrivateTuesdayPage />} />

        {/* Authenticated routes */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/paused" element={<PausedPage />} />
          <Route path="/workshop/:stage" element={<WorkshopStage />} />
          <Route path="/audit/:slug" element={<WorkshopAuditPage />} />



          {/* Dashboard nested routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="brief" element={<DashboardBrief />} />
            <Route path="day" element={<DashboardDay />} />
            <Route path="deliverables" element={<DashboardDeliverables />} />
            <Route path="documents" element={<DashboardDocuments />} />
            <Route path="files" element={<DashboardFiles />} />
            <Route path="filing" element={<DashboardFiling />} />
            <Route path="goals" element={<DashboardGoals />} />
            <Route path="media" element={<DashboardMedia />} />
            <Route path="profile" element={<DashboardProfile />} />
            <Route path="workflow" element={<DashboardWorkflow />} />
            <Route path="workflow/:key" element={<DashboardWorkflowKey />} />
            <Route path="legal-setup" element={<DashboardLegalSetup />} />
            <Route path="brain" element={<DashboardBrain />} />
            <Route path="hub" element={<HubLibrary />} />
            <Route path="hub/new" element={<HubNew />} />
            <Route path="hub/:snapshotId" element={<HubSnapshot />} />
          </Route>


          {/* Admin nested routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminIndex />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/decks" element={<AdminDecks />} />
            <Route path="/admin/decks/:slug" element={<AdminDeckEditor />} />
            <Route path="/admin/review" element={<AdminReview />} />
            <Route path="/admin/registrations" element={<AdminRegistrations />} />
            <Route path="/admin/private-sessions" element={<AdminPrivateSessions />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/members/:userId/view" element={<AdminMembersUserView />} />
            <Route path="/admin/hub" element={<AdminHub />} />

            <Route path="/admin/media" element={<AdminMedia />} />
            <Route path="/admin/testimonials" element={<AdminTestimonials />} />
            <Route path="/admin/video-wall" element={<AdminVideoWall />} />
            <Route path="/admin/hero-images" element={<AdminHeroImages />} />
            <Route path="/admin/audits" element={<AdminAudits />} />
            <Route path="/admin/cohorts" element={<AdminCohorts />} />
            
            <Route path="/admin/attendees" element={<AdminAttendees />} />
            <Route path="/admin/attendees/:userId" element={<AdminAttendeesUserIndex />} />
            <Route path="/admin/attendees/:userId/workflow" element={<AdminAttendeesUserWorkflow />} />
            <Route path="/admin/attendees/:userId/media" element={<AdminAttendeesUserMedia />} />
            <Route path="/admin/attendees/:userId/deliverables/:key" element={<AdminAttendeesUserDeliverables />} />
            <Route path="/admin/applications" element={<AdminApplicationsIndex />} />
            <Route path="/admin/applications/:id" element={<AdminApplicationsId />} />
            <Route path="/admin/inquiries" element={<AdminInquiriesIndex />} />
            <Route path="/admin/inquiries/:id" element={<AdminInquiriesId />} />
            <Route path="/admin/social" element={<AdminSocialIndex />} />
            <Route path="/admin/social/accounts" element={<AdminSocialAccounts />} />
            <Route path="/admin/social/compose" element={<AdminSocialCompose />} />
            <Route path="/admin/social/posts" element={<AdminSocialPosts />} />
            <Route path="/admin/social/analytics" element={<AdminSocialAnalytics />} />
            <Route path="/admin/social/setup" element={<AdminSocialSetup />} />
            <Route path="/admin/social/setup/intake" element={<AdminSocialSetupIntake />} />
            <Route path="/admin/social/setup/creative" element={<AdminSocialSetupCreative />} />
            <Route path="/admin/social/setup/creative/:assetType" element={<AdminSocialSetupCreativeAsset />} />
            <Route path="/admin/social/setup/:platform" element={<AdminSocialSetupPlatform />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <AskConcierge />
      </LandingOnlyGate>
      </ConfirmProvider>
    </Suspense>
  );
}
