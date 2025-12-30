// Subscription Plan Access Rules
export const PLAN_FEATURES = {
  1: { // BASIC PLAN
    name: "BASIC PLAN",
    features: [
      "meta-ads",
      "whatsapp-marketing",
      "email-marketing",
      "creative-workshop",
      "basic-support",
    ],
  },
  2: { // PREMIUM PLAN
    name: "PREMIUM PLAN",
    features: [
      "meta-ads",
      "whatsapp-marketing",
      "email-marketing",
      "sms-marketing",
      "ivr-campaign",
      "creative-workshop",
      "priority-support",
    ],
  },
};

// Check if user has access to a feature
export const hasFeatureAccess = (subscription, feature) => {
  // First check if subscription exists and is active
  if (!subscription || subscription === null || subscription === undefined) {
    console.log("🔒 Feature access check: No subscription object for feature:", feature);
    return false;
  }
  
  if (subscription.subscriptionStatus !== "active") {
    console.log("🔒 Feature access check: Status is not active:", subscription.subscriptionStatus);
    return false;
  }

  // Check if subscription is expired
  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    if (endDate < now) {
      console.log("🔒 Feature access check: Subscription expired");
      return false;
    }
  }

  const planId = subscription.planId;
  const planFeatures = PLAN_FEATURES[planId]?.features || [];
  
  const hasAccess = planFeatures.includes(feature);
  console.log(`🔒 Feature access check: Feature "${feature}" ${hasAccess ? "GRANTED" : "DENIED"} for plan ${planId}`);
  
  return hasAccess;
};

// Check if user has active subscription
export const hasActiveSubscription = (subscription) => {
  // Strict check: subscription must exist and be truthy
  if (!subscription || subscription === null || subscription === undefined) {
    console.log("🔒 Subscription check: No subscription object");
    return false;
  }
  
  // Must have active status
  if (subscription.subscriptionStatus !== "active") {
    console.log("🔒 Subscription check: Status is not active:", subscription.subscriptionStatus);
    return false;
  }
  
  // Check if expired
  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    if (endDate < now) {
      console.log("🔒 Subscription check: Subscription expired");
      return false;
    }
  }
  
  console.log("✅ Subscription check: Active subscription found");
  return true;
};

// Get plan name
export const getPlanName = (planId) => {
  return PLAN_FEATURES[planId]?.name || "No Plan";
};

// Check if feature requires premium
export const isPremiumFeature = (feature) => {
  return feature === "sms-marketing" || feature === "ivr-campaign";
};

