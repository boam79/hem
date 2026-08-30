import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { koreanizePublicText } from "@/lib/ko-display";
import type { Memo } from "@/lib/schema";

const PERSONA_LABEL = {
  cfo: "재무이사",
  mkt: "마케팅실장",
  md: "진료원장",
} as const;

export function MemoView({ memo }: { memo: Memo }) {
  return (
    <div className="mt-8 grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>합의점</CardTitle>
        </CardHeader>
        <CardContent>
          {memo.consensus.length === 0 ? (
            <p className="text-muted-foreground text-sm">없음</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {memo.consensus.map((item) => (
                <li key={item}>{koreanizePublicText(item)}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>미해결 쟁점</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {memo.open_issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">없음</p>
          ) : (
            memo.open_issues.map((row) => (
              <div key={row.issue} className="text-sm">
                <p className="font-medium">{koreanizePublicText(row.issue)}</p>
                <ul className="text-muted-foreground mt-1 list-disc pl-5">
                  <li>재무: {koreanizePublicText(row.positions.cfo)}</li>
                  <li>마케팅: {koreanizePublicText(row.positions.mkt)}</li>
                  <li>진료: {koreanizePublicText(row.positions.md)}</li>
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>부족한 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          {memo.missing_data.length === 0 ? (
            <p className="text-muted-foreground text-sm">없음</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {memo.missing_data.map((item) => (
                <li key={item}>{koreanizePublicText(item)}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>선택지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {memo.options.length === 0 ? (
            <p className="text-muted-foreground text-sm">없음</p>
          ) : (
            memo.options.map((row) => (
              <div key={row.option} className="text-sm">
                <p>{koreanizePublicText(row.option)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {row.supported_by.map((key) => (
                    <Badge key={key} variant="secondary">
                      {PERSONA_LABEL[key]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
