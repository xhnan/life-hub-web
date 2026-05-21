// 健康管理后台 - 类型定义

export interface AdminOverviewVO {
  totalUsers: number;
  todayActiveUsers: number;
  totalHealthRecords: number;
  avgMoodScore: number;
  totalActivities: number;
  totalDietLogs: number;
  totalWeightLogs: number;
  totalAssessments: number;
  recentActiveUsers: RecentActiveUserVO[];
}

export interface RecentActiveUserVO {
  userId: number;
  username: string;
  nickname: string;
  lastActiveTime: string;
  totalRecords: number;
}

export interface AdminTrendVO {
  date: string;
  activeUsers: number;
  newRecords: number;
  avgSteps: number;
  avgMoodScore: number;
}

export interface AdminUserSummaryVO {
  userId: number;
  username: string;
  nickname: string;
  latestWeight: number | null;
  latestMoodScore: number | null;
  lastActiveDate: string | null;
  totalRecords: number;
}

export interface AdminUserDetailVO {
  userId: number;
  username: string;
  nickname: string;
  profile: any;
  activities: any[];
  dietLogs: any[];
  weightLogs: any[];
  goals: any[];
  assessments: any[];
  dailyMoods: any[];
}

export interface PsychologyAlertVO {
  userId: number;
  username: string;
  nickname: string;
  scaleName: string;
  totalScore: number;
  severityLevel: string;
  assessmentDate: string;
}

export interface AdminUserListParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}
