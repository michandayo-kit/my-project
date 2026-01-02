import { useState } from "react";
import {
  getYearlyRemaining,
  getMonthlyRemaining,
  getDailyRemaining,
  type Expense,
  type Budget,
} from "./domain/budgetCalculator";

type CategoryType = "fixed" | "semi_fixed" | "one_time" | "daily";

type Category = {
  id: number;
  name: string;
  type: CategoryType;
};

type Budget =
  | { type: "fixed"; data: FixedBudget }
  | { type: "semi_fixed"; data: SemiFixedBudget }
  | { type: "variable"; data: VariableBudget };

type FixedBudget = {
  categoryId: number;
  monthlyAmount: number;
  startMonth: string; // "2024-04"
  endMonth?: string;  // undefined = 現在も有効
};

type SemiFixedBudget = {
  categoryId: number;
  monthlyLimit: number;
};

type VariableBudget = {
  categoryId: number;
  yearlyAmount: number;
};

type Expense = {
  id: number;
  categoryId: number;
  amount: number;
  date: string;
  memo?: string;
  isDeleted: boolean; 
};


// テストデータ
const categories: Category[] = [
  { id: 1, name: "家賃", type: "fixed" },
  { id: 2, name: "食費", type: "daily" },
  { id: 3, name: "交際費", type: "one_time" },
];
const budgets: Budget[] = [
  { categoryId: 1, yearlyAmount: 1200000 }, // 家賃
  { categoryId: 2, yearlyAmount: 360000 },  // 食費
  { categoryId: 3, yearlyAmount: 100000 },  // 交際費
];
const fixedBudgets: FixedBudget[] = [
  {
    categoryId: 1,       // 家賃
    monthlyAmount: 100000,
    startMonth: "2024-04",
  },
];



const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.4)",
  zIndex: 999,
};

const modalStyle: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  padding: "16px",
  borderRadius: "8px",
  minWidth: "300px",
};

function App() {  
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memo, setMemo] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today); 

  // モーダル用
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleAdd = () => {
    if (!categoryId || !amount) return;
  
    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        categoryId: Number(categoryId),
        amount: Number(amount),
        date: date,
        memo: memo || undefined,
        isDeleted: false,
      },
    ]);
  
    setAmount("");
    setMemo("");
  };
   
  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? "";
 
  const handleDelete = (id: number) => {
    setExpenses(
      expenses.map((e) =>
        e.id === id ? { ...e, isDeleted: true } : e
      )
    );
  };

  // 固定費の月合計を返す関数
  const getMonthlyFixedAmount = (categoryId: number) => {
    return expenses
      .filter(
        (e) =>
          !e.isDeleted &&
          e.categoryId === categoryId &&
          isSameMonth(e.date)
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

 

  // 月が範囲内かを判定するヘルパー
  function isMonthInRange(
    target: string,      // "2025-01"
    start: string,       // "2024-04"
    end?: string         // "2025-03"
  ): boolean {
    if (target < start) return false;
    if (end && target > end) return false;
    return true;
  }

  // 固定費の月額を1つ取得する関数
  function getFixedMonthlyAmount(
    budgets: FixedBudget[],
    categoryId: number,
    targetMonth: string // "2025-01"
  ): number {
    const budget = budgets.find(
      (b) =>
        b.categoryId === categoryId &&
        isMonthInRange(targetMonth, b.startMonth, b.endMonth)
    );
  
    return budget?.monthlyAmount ?? 0;
  }  

  // ヘルパー関数
  const getCategoryType = (categoryId: number): CategoryType | undefined =>
    categories.find((c) => c.id === categoryId)?.type;
  
  const isSameMonth = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  };
  
  const isFixedExpense = (expense: Expense) => {
    return getCategoryType(expense.categoryId) === "fixed";
  };
  

  const fixedExpenses = expenses.filter(
    (e) => !e.isDeleted && getCategoryType(e.categoryId) === "fixed"
  );
  
  const fixedCategories = categories.filter(
    (c) => c.type === "fixed"
  );

  const oneTimeExpenses = expenses.filter(
    (e) => !e.isDeleted && getCategoryType(e.categoryId) === "one_time"
  );
  
  const dailyExpenses = expenses.filter(
    (e) => !e.isDeleted && getCategoryType(e.categoryId) === "daily"
  );  

  const expensesForCalc = expenses.filter(
    (e) => !e.isDeleted && getCategoryType(e.categoryId) !== "fixed"
  );

  const handleUpdate = () => {
    if (!editingExpense) return;
  
    setExpenses(
      expenses.map((e) =>
        e.id === editingExpense.id ? editingExpense : e
      )
    );
  
    setEditingExpense(null);
  };
  

  // 確認用テストコード
  const fiscalStartMonth = 4; // 4月始まり
  const baseDate = new Date(date); // 画面で選択中の日付
  // budgets.forEach((b) => {
  //   const remaining = getYearlyRemaining(
  //     b,
  //     expensesForCalc,
  //     baseDate,
  //     fiscalStartMonth
  //   );

  //   console.log(
  //     `【${getCategoryName(b.categoryId)}】年残金: ${remaining}円`
  //   );
  // });
  // budgets.forEach((b) => {
  //   const monthly = getMonthlyRemaining(
  //     b,
  //     expensesForCalc,
  //     baseDate,
  //     fiscalStartMonth
  //   );
  
  //   console.log(
  //     `【${getCategoryName(b.categoryId)}】今月使える: ${monthly}円`
  //   );
  // });
  // budgets.forEach((b) => {
  //   const daily = getDailyRemaining(
  //     b,
  //     expensesForCalc,
  //     baseDate,
  //     fiscalStartMonth
  //   );
  
  //   console.log(
  //     `【${getCategoryName(b.categoryId)}】今日使える: ${daily}円`
  //   );
  // });
  // const targetMonth = "2025-01";
  // const rent = getFixedMonthlyAmount(
  //   fixedBudgets,
  //   1, // 家賃
  //   targetMonth
  // );
  // console.log(`家賃: ${rent}円`);
  budgets.forEach((b) => {
    const remaining = getYearlyRemaining(
      b,
      expenses,
      baseDate,
      fiscalStartMonth
    );
    console.log(
      `【${getCategoryName(b.categoryId)}】年残金: ${remaining}円`
    );
  });

  



  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>支出入力</h2>
      <div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
        >
          <option value="">カテゴリ選択</option>

          {categories
            .filter((c) => c.type !== "fixed")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <input
          type="number"
          placeholder="金額"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>  
        <input
          type="text"
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <button onClick={handleAdd}>登録</button>

      <hr />

      <h2>支出一覧</h2>
      <h3>固定費</h3>
        <ul>
        {fixedCategories.map((c) => {
          const amount = getMonthlyFixedAmount(c.id);

          return (
            <li key={c.id}>
              {c.name} / {amount}円
              {getCategoryType(c.categoryId) !== "fixed" && (
                <button onClick={() => handleDelete(c.id)}>削除</button>
              )}
              <button onClick={() => setEditingExpense(c)}>編集</button>
            </li>
          );
        })}
      </ul>
      <h3>単発費</h3>
      <ul>
        {expenses
          .filter(
            (e) =>
              !e.isDeleted &&
              getCategoryType(e.categoryId) === "one_time"
          )
          .map((e) => (
            <li key={e.id}>
              {getCategoryName(e.categoryId)} / {e.amount}円
              <button onClick={() => handleDelete(e.id)}>削除</button>
              <button onClick={() => setEditingExpense(e)}>編集</button>
            </li>
          ))}
      </ul>
      <h3>日残金費</h3>
      <ul>
        {expenses
          .filter(
            (e) =>
              !e.isDeleted &&
              getCategoryType(e.categoryId) === "daily"
          )
          .map((e) => (
            <li key={e.id}>
              {e.date} / {getCategoryName(e.categoryId)} / {e.amount}円
              <button onClick={() => handleDelete(e.id)}>削除</button>
              <button onClick={() => setEditingExpense(e)}>編集</button>
            </li>
          ))}
      </ul>

      {editingExpense && (
        <div style={overlayStyle} onClick={() => setEditingExpense(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

            {(() => {
              const isFixed =
                getCategoryType(editingExpense.categoryId) === "fixed";

              return (
                <>
                  <h3>支出編集</h3>

                  <select
                    value={editingExpense.categoryId}
                    disabled={isFixed}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        categoryId: Number(e.target.value),
                      })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {!isFixed && (
                    <input
                      type="date"
                      value={editingExpense.date}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          date: e.target.value,
                        })
                      }
                    />
                  )}

                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        amount: Number(e.target.value),
                      })
                    }
                  />

                  <input
                    type="text"
                    value={editingExpense.memo ?? ""}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        memo: e.target.value,
                      })
                    }
                  />

                  <button onClick={handleUpdate}>保存</button>
                  <button onClick={() => setEditingExpense(null)}>
                    キャンセル
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>  
  );
}


export default App;
