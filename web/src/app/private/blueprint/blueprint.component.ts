import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { MindsetComponent } from "./foundations/mindset/mindset.component";
import { RealityCheckComponent } from "./foundations/reality-check/reality-check.component";
import { HypertrophyTrifectaComponent } from "./foundations/hypertrophy-trifecta/hypertrophy-trifecta.component";
import { GrowthCycleVisualizerComponent } from "./foundations/growth-cycle-visualizer/growth-cycle-visualizer.component";
import { NutritionBlueprintComponent } from "./nutrition/nutrition-blueprint/nutrition-blueprint.component";
import { AdvancedNutritionStrategiesComponent } from "./nutrition/advanced-nutrition-strategies/advanced-nutrition-strategies.component";
import { SupplementGuideComponent } from "./nutrition/supplement-guide/supplement-guide.component";
import { TrainingPyramidComponent } from "./training/training-pyramid/training-pyramid.component";
import { TrainingPrinciplesComponent } from "./training/training-principles/training-principles.component";
import { ExerciseTechniqueComponent } from "./training/exercise-technique/exercise-technique.component";
import { AssistanceLiftsComponent } from "./training/assistance-lifts/assistance-lifts.component";
import { SafetyAndWarmupsComponent } from "./recovery/safety-and-warmups/safety-and-warmups.component";
import { MobilityAndFlexibilityComponent } from "./recovery/mobility-and-flexibility/mobility-and-flexibility.component";
import { CardioIntegrationComponent } from "./recovery/cardio-integration/cardio-integration.component";
import { RehabProtocolsComponent } from "./recovery/rehab-protocols/rehab-protocols.component";
import { ActiveRecoveryComponent } from "./recovery/active-recovery/active-recovery.component";
import { MentalFortitudeComponent } from "./foundations/mental-fortitude/mental-fortitude.component";
import { ProgramTemplatesComponent } from "./training/program-templates/program-templates.component";
import { SkincareBlueprintComponent } from "./recovery/skincare-blueprint/skincare-blueprint.component";
import { ProgressAndPlateausComponent } from "./tracking/progress-and-plateaus/progress-and-plateaus.component";
import { TroubleshootingGuideComponent } from "./tracking/troubleshooting-guide/troubleshooting-guide.component";
import { PerformanceMetricsComponent } from "./tracking/performance-metrics/performance-metrics.component";
import { BehaviorAndAdherenceComponent } from "./tracking/behavior-and-adherence/behavior-and-adherence.component";
import { FemaleFactorComponent } from "./specialized/female-factor/female-factor.component";
import { AgeSpecificTrainingComponent } from "./specialized/age-specific-training/age-specific-training.component";
import { LifestyleAdaptationsComponent } from "./specialized/lifestyle-adaptations/lifestyle-adaptations.component";
import { HomeGymBlueprintComponent } from "./specialized/home-gym-blueprint/home-gym-blueprint.component";
import { TechIntegrationComponent } from "./specialized/tech-integration/tech-integration.component";
import { QuickStartGuideComponent } from "./core/quick-start-guide/quick-start-guide.component";
import { IntensityTechniquesComponent } from "./advanced/intensity-techniques/intensity-techniques.component";
import { PeriodizationModelsComponent } from "./advanced/periodization-models/periodization-models.component";
import { PageHeaderComponent } from "./core/page-header/page-header.component";
import { PageFooterComponent } from "./core/page-footer/page-footer.component";

@Component({
    selector: 'app-blueprint',
    imports: [RouterOutlet, FormsModule, ReactiveFormsModule, CommonModule, MindsetComponent, RealityCheckComponent, HypertrophyTrifectaComponent, GrowthCycleVisualizerComponent, NutritionBlueprintComponent, AdvancedNutritionStrategiesComponent, SupplementGuideComponent, TrainingPyramidComponent, TrainingPrinciplesComponent, ExerciseTechniqueComponent, AssistanceLiftsComponent, SafetyAndWarmupsComponent, MobilityAndFlexibilityComponent, CardioIntegrationComponent, RehabProtocolsComponent, ActiveRecoveryComponent, MentalFortitudeComponent, ProgramTemplatesComponent, SkincareBlueprintComponent, ProgressAndPlateausComponent, TroubleshootingGuideComponent, PerformanceMetricsComponent, BehaviorAndAdherenceComponent, FemaleFactorComponent, AgeSpecificTrainingComponent, LifestyleAdaptationsComponent, HomeGymBlueprintComponent, TechIntegrationComponent, QuickStartGuideComponent, IntensityTechniquesComponent, PeriodizationModelsComponent, PageHeaderComponent, PageFooterComponent],
    templateUrl: './blueprint.component.html'
})
export class BlueprintComponent {
  showTableOfContents = true;
  
  // All sections organized by category for the table of contents
  sections = [
    {
      id: 'foundations',
      title: '🏗️ Foundations',
      description: 'Build your mindset and understand the core principles',
      items: [
        { id: 'mindset', title: 'Mindset & Mental Framework' },
        { id: 'reality-check', title: 'Reality Check' },
        { id: 'hypertrophy-trifecta', title: 'Hypertrophy Trifecta' },
        { id: 'growth-cycle-visualizer', title: 'Growth Cycle Visualizer' },
        { id: 'mental-fortitude', title: 'Mental Fortitude' }
      ]
    },
    {
      id: 'nutrition',
      title: '🥗 Nutrition',
      description: 'Master your nutrition for optimal results',
      items: [
        { id: 'nutrition-blueprint', title: 'Nutrition Blueprint' },
        { id: 'advanced-nutrition-strategies', title: 'Advanced Nutrition Strategies' },
        { id: 'supplement-guide', title: 'Supplement Guide' }
      ]
    },
    {
      id: 'training',
      title: '💪 Training',
      description: 'Comprehensive training principles and programs',
      items: [
        { id: 'training-pyramid', title: 'Training Pyramid' },
        { id: 'training-principles', title: 'Training Principles' },
        { id: 'exercise-technique', title: 'Exercise Technique' },
        { id: 'assistance-lifts', title: 'Assistance Lifts' },
        { id: 'program-templates', title: 'Program Templates' },
        { id: 'intensity-techniques', title: 'Intensity Techniques' },
        { id: 'periodization-models', title: 'Periodization Models' }
      ]
    },
    {
      id: 'recovery',
      title: '🧘 Recovery & Longevity',
      description: 'Optimize recovery and long-term health',
      items: [
        { id: 'safety-and-warmups', title: 'Safety & Warmups' },
        { id: 'mobility-and-flexibility', title: 'Mobility & Flexibility' },
        { id: 'cardio-integration', title: 'Cardio Integration' },
        { id: 'rehab-protocols', title: 'Rehab Protocols' },
        { id: 'active-recovery', title: 'Active Recovery' },
        { id: 'skincare-blueprint', title: 'Skincare Blueprint' }
      ]
    },
    {
      id: 'tracking',
      title: '📊 Tracking & Adherence',
      description: 'Monitor progress and maintain consistency',
      items: [
        { id: 'progress-and-plateaus', title: 'Progress & Plateaus' },
        { id: 'troubleshooting-guide', title: 'Troubleshooting Guide' },
        { id: 'performance-metrics', title: 'Performance Metrics' },
        { id: 'behavior-and-adherence', title: 'Behavior & Adherence' }
      ]
    },
    {
      id: 'specialized',
      title: '🎯 Specialized Guides',
      description: 'Tailored approaches for specific needs',
      items: [
        { id: 'female-factor', title: 'Female Factor' },
        { id: 'age-specific-training', title: 'Age-Specific Training' },
        { id: 'lifestyle-adaptations', title: 'Lifestyle Adaptations' },
        { id: 'home-gym-blueprint', title: 'Home Gym Blueprint' },
        { id: 'tech-integration', title: 'Tech Integration' }
      ]
    },
    {
      id: 'guides',
      title: '🚀 Quick Start Guide',
      description: 'Get started with actionable steps',
      items: [
        { id: 'quick-start-guide', title: 'Quick Start Guide' }
      ]
    }
  ];

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }

  toggleTableOfContents() {
    this.showTableOfContents = !this.showTableOfContents;
  }

  getAllSections() {
    return this.sections.flatMap(category => category.items);
  }
}
