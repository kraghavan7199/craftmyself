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
  activeTab = 'foundations';
  completedSections = new Set<string>();
  expandedSections = new Set<string>();
  isMobileDropdownOpen = false;
  
  tabs = [
    { id: 'foundations', label: 'Foundations', icon: '🏗️' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'training', label: 'Training', icon: '💪' },
    { id: 'recovery', label: 'Recovery', icon: '🧘' },
    { id: 'tracking', label: 'Tracking', icon: '📊' },
    { id: 'specialized', label: 'Specialized', icon: '🎯' },
    { id: 'guides', label: 'Quick Start', icon: '🚀' }
  ];

  sectionsByTab = {
    foundations: ['mindset', 'reality-check', 'hypertrophy-trifecta', 'growth-cycle-visualizer', 'mental-fortitude'],
    nutrition: ['nutrition-blueprint', 'advanced-nutrition-strategies', 'supplement-guide'],
    training: ['training-pyramid', 'training-principles', 'exercise-technique', 'assistance-lifts', 'program-templates', 'intensity-techniques', 'periodization-models'],
    recovery: ['safety-and-warmups', 'mobility-and-flexibility', 'cardio-integration', 'rehab-protocols', 'active-recovery', 'skincare-blueprint'],
    tracking: ['progress-and-plateaus', 'troubleshooting-guide', 'performance-metrics', 'behavior-and-adherence'],
    specialized: ['female-factor', 'age-specific-training', 'lifestyle-adaptations', 'home-gym-blueprint', 'tech-integration'],
    guides: ['quick-start-guide']
  };

  sectionTitles: { [key: string]: string } = {
    'mindset': 'Mindset & Mental Framework',
    'reality-check': 'Reality Check',
    'hypertrophy-trifecta': 'Hypertrophy Trifecta',
    'growth-cycle-visualizer': 'Growth Cycle Visualizer',
    'mental-fortitude': 'Mental Fortitude',
    'nutrition-blueprint': 'Nutrition Blueprint',
    'advanced-nutrition-strategies': 'Advanced Nutrition Strategies',
    'supplement-guide': 'Supplement Guide',
    'training-pyramid': 'Training Pyramid',
    'training-principles': 'Training Principles',
    'exercise-technique': 'Exercise Technique',
    'assistance-lifts': 'Assistance Lifts',
    'program-templates': 'Program Templates',
    'intensity-techniques': 'Intensity Techniques',
    'periodization-models': 'Periodization Models',
    'safety-and-warmups': 'Safety & Warmups',
    'mobility-and-flexibility': 'Mobility & Flexibility',
    'cardio-integration': 'Cardio Integration',
    'rehab-protocols': 'Rehab Protocols',
    'active-recovery': 'Active Recovery',
    'skincare-blueprint': 'Skincare Blueprint',
    'progress-and-plateaus': 'Progress & Plateaus',
    'troubleshooting-guide': 'Troubleshooting Guide',
    'performance-metrics': 'Performance Metrics',
    'behavior-and-adherence': 'Behavior & Adherence',
    'female-factor': 'Female Factor',
    'age-specific-training': 'Age-Specific Training',
    'lifestyle-adaptations': 'Lifestyle Adaptations',
    'home-gym-blueprint': 'Home Gym Blueprint',
    'tech-integration': 'Tech Integration',
    'quick-start-guide': 'Quick Start Guide'
  };

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  isSectionVisible(sectionId: string): boolean {
    return this.sectionsByTab[this.activeTab as keyof typeof this.sectionsByTab]?.includes(sectionId) || false;
  }

  markSectionCompleted(sectionId: string) {
    this.completedSections.add(sectionId);
  }

  isSectionCompleted(sectionId: string): boolean {
    return this.completedSections.has(sectionId);
  }


  toggleSection(sectionId: string) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }

  expandAll() {
    const currentSections = this.sectionsByTab[this.activeTab as keyof typeof this.sectionsByTab] || [];
    currentSections.forEach(section => this.expandedSections.add(section));
  }

  collapseAll() {
    const currentSections = this.sectionsByTab[this.activeTab as keyof typeof this.sectionsByTab] || [];
    currentSections.forEach(section => this.expandedSections.delete(section));
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getActiveTab(): { id: string; label: string; icon: string } {
    return this.tabs.find(t => t.id === this.activeTab) || this.tabs[0];
  }

  toggleMobileDropdown(): void {
    this.isMobileDropdownOpen = !this.isMobileDropdownOpen;
  }

  getActiveSections(): string[] {
    return this.sectionsByTab[this.activeTab as keyof typeof this.sectionsByTab] || [];
  }
}
