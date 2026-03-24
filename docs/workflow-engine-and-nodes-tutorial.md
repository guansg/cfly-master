# 工作流手动测试用例

操作：**拖节点 → 连线 → 右侧填参 → 保存 → 运行**。`Set Data` 造数用 **`mode = json`** + `jsonData`（JSON 字符串）。

---

## 基础（连通）

`Manual Trigger` → `Set Data` → `Log`

- Set Data：`jsonData = {"message":"hello"}`
- Log：`message = {{ $json.message }}`，`level = info`

---

## L1 — If（`logic:condition`）

`Manual` → `Set Data` → **If** → `Log`（true 口）、`Log`（false 口）

- If — `combineOperation`：`all`  
- If — `conditions`：

```json
[{"field":"{{ $json.score }}","operator":"gt","value":80}]
```

- Log：`message = {{ $json.score }}`
- 先保存 `jsonData = {"score":90}` 跑一次；再改为 `{"score":50}` 跑一次。

---

## L2 — Switch（`logic:switch`）

`Manual` → `Set Data` → **Switch** → `Log`（`output-0`）、`Log`（`output-3`）

- Switch — `field`：`{{ $json.type }}`
- Switch — `cases`：`[{"value":"a"},{"value":"b"},{"value":"c"}]`
- 先 `jsonData = {"type":"a"}` 跑一次；再 `{"type":"x"}` 跑一次。

---

## L3 — Loop（`logic:loop`）

`Manual` → `Set Data` → **Loop** → `Log`（batch）、`Log`（remaining）

- Set Data：`jsonData = {"name":"solo"}`
- Loop：`batchSize = 1`
- Log：`message = {{ JSON.stringify($json) }}`

---

## L4 — While（`logic:while`）

`Manual` → `Set Data` → **While** → `Log`（continue / `output-0`）、`Log`（done / `output-1`）

- While — `condition`：`{{ $json.continue === true }}`
- 先 `jsonData = {"continue":true}`；再 `{"continue":false}`。

---

## L5 — Parallel（`logic:parallel`）

`Manual` → `Set Data` → **Parallel** → `Log`

- Set Data：`jsonData = {"task":"one"}`
- Parallel：`concurrency = 2`，`delayBetweenBatchesMs = 0`
- Log：`message = {{ JSON.stringify($json) }}`

---

## L6 — Merge（`logic:merge`）

`Manual Trigger A` → `Set Data A` → **Merge**（输入 1）  
`Manual Trigger B` → `Set Data B` → **Merge**（输入 2）  
**Merge** → `Log`

- Set Data A：`jsonData = {"source":"A"}`
- Set Data B：`jsonData = {"source":"B"}`
- Merge：`mode = append`（或 `zip` / `passthrough`）
- Log：`message = {{ JSON.stringify($json) }}`

---

## L7 — Delay（`logic:delay`）

`Manual` → `Set Data` → **Delay** → `Log`

- Delay：`delayMs = 3000`
- Log：`message = {{ JSON.stringify($json) }}`

---

## L8 — Stop（`logic:stop`）

`Manual` → `Set Data` → **Stop**

- Set Data：`jsonData = {"data":"ok"}`
- 先 `isError = false`，`message = Workflow stopped` 跑一次；再 `isError = true` 跑一次。
