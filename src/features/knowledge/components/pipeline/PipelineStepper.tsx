import type { PipelineStep } from '../../model/types';
import s from '../page.module.css';

const META: Record<PipelineStep['key'], { eng: string; title: string }> = {
  monitoring: { eng: 'MONITORING', title: '지식 모니터링' },
  detection: { eng: 'DETECTION', title: '문제 / 부족 지식 탐지' },
  proposal: { eng: 'PROPOSAL', title: 'Learning / Unlearning 제안' },
  approval: { eng: 'APPROVAL', title: '사용자 승인' },
  apply: { eng: 'APPLY', title: 'AI 지식 반영' },
};

export function PipelineStepper({ steps }: { steps: PipelineStep[] }) {
  return (
    <section className={s.steps} aria-label="지식 관리 흐름">
      <ol className={s.stepList}>
        {steps.map((st, i) => (
          <li key={st.key} className={`${s.step} ${s[`step_${st.state}`]}`} aria-current={st.state === 'current' ? 'step' : undefined}>
            <div className={s.stepTrack}>
              <span className={s.stepDot}>{st.state === 'done' ? '✓' : i + 1}</span>
              {i < steps.length - 1 ? <span className={s.stepLine} /> : null}
            </div>
            <span className={s.stepEng}>{META[st.key].eng}</span>
            <span className={s.stepTitle}>{META[st.key].title}</span>
            <span className={s.stepDesc}>{st.summary}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
