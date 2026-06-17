import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectsService } from '../../core/projects.service';
import { ProjectSummary } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, GwCardComponent, GwBadgeComponent, GwAlertComponent],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
    .stat { font-size: 1.6rem; font-weight: 700; margin: .25rem 0 0; }
  `],
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(ProjectsService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly summary = signal<ProjectSummary | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.svc.summary(this.id).subscribe({
      next: (s) => { this.summary.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusVariant(s?: string): string {
    return { active: 'success', on_hold: 'warning', completed: 'primary', cancelled: 'neutral' }[s ?? ''] ?? 'neutral';
  }
}
