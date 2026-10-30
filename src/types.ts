export type ShapePair = 'prism_pyramid' | 'cylinder_cone';

export type LiquidType = 'water' | 'sand';

export type ControlMode = 'manual' | 'auto'; // 직접 실험하기 vs 자동 시연

export type ExperimentStage = 
  | 'ready'            // 준비 (용기 비어있음)
  | 'fill_cone'        // 1단계: 뿔에 물/모래 채우는 중
  | 'cone_filled'      // 뿔 가득 참 (기울여 부을 준비 완료)
  | 'pouring_1'        // 1회차 붓는 중
  | 'completed_1'      // 1회차 완료 (1/3 도달)
  | 'pouring_2'        // 2회차 붓는 중
  | 'completed_2'      // 2회차 완료 (2/3 도달)
  | 'pouring_3'        // 3회차 붓는 중
  | 'completed_3';     // 3회차 완료 (3/3 완전 가득 참!)

export interface ObservationRecord {
  pour1: string; // '1/3'
  pour2: string; // '2/3'
  pour3: string; // '3/3' or '가득'
  conclusion: string; // '1/3'
  studentName: string;
  isCompleted: boolean;
}
