(function () {
  const STORAGE_KEY = "floralStudioMvp";
  const today = () => new Date().toISOString().slice(0, 10);
  const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  };

  const initialState = {
    products: [
      {
        id: "bouquet",
        name: "꽃다발",
        description: "개인 선물과 기념일에 적합합니다.",
        imageUrl: "assets/bouquet.svg",
        minBudget: 30000,
        budgets: [30000, 50000, 70000, 100000],
        pickup: true,
        delivery: true,
        available: true,
        visible: true,
        images: ["핑크톤 예시", "화이트톤 예시"],
      },
      {
        id: "basket",
        name: "꽃바구니",
        description: "풍성한 선물과 행사에 적합합니다.",
        imageUrl: "assets/basket.svg",
        minBudget: 50000,
        budgets: [50000, 70000, 100000, 150000],
        pickup: true,
        delivery: true,
        available: true,
        visible: true,
        images: ["화사한 예시", "고급스러운 예시"],
      },
      {
        id: "plant",
        name: "화분",
        description: "개업, 집들이, 사무실 선물에 적합합니다.",
        imageUrl: "assets/plant.svg",
        minBudget: 50000,
        budgets: [50000, 70000, 100000, 150000],
        pickup: true,
        delivery: true,
        available: true,
        visible: true,
        images: ["관엽 예시", "테이블 화분 예시"],
      },
      {
        id: "custom",
        name: "맞춤주문",
        description: "참고 사진과 요청사항을 바탕으로 상담합니다.",
        imageUrl: "assets/custom.svg",
        minBudget: 0,
        budgets: [0],
        pickup: true,
        delivery: true,
        available: true,
        visible: true,
        images: ["상담 주문"],
      },
    ],
    deliveryAreas: [
      { id: "gangnam", name: "강남구", fee: 5000, available: true },
      { id: "seocho", name: "서초구", fee: 5000, available: true },
      { id: "songpa", name: "송파구", fee: 7000, available: true },
      { id: "other", name: "그 외 지역 상담", fee: 0, available: false },
    ],
    orders: [],
    customers: [],
    notifications: [],
  };

  let selectedOrderId = null;

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saveState(initialState);
      return structuredClone(initialState);
    }
    const state = { ...structuredClone(initialState), ...JSON.parse(saved) };
    state.products = state.products.map((product) => {
      const fallback = initialState.products.find((item) => item.id === product.id);
      return { ...fallback, ...product, imageUrl: product.imageUrl || fallback?.imageUrl || "" };
    });
    return state;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function money(value) {
    if (!value) return "상담";
    return `${Number(value).toLocaleString("ko-KR")}원`;
  }

  function orderNumber() {
    return `FS-${Date.now().toString().slice(-8)}`;
  }

  function notify(state, target, message, status = "success") {
    state.notifications.unshift({
      id: crypto.randomUUID(),
      target,
      message,
      status,
      createdAt: new Date().toLocaleString("ko-KR"),
    });
  }

  function upsertCustomer(state, order) {
    const key = `${order.customerName}|${order.customerPhone}`;
    let customer = state.customers.find((item) => item.key === key);
    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        key,
        name: order.customerName,
        phone: order.customerPhone,
        memo: "",
        tags: [],
        orderIds: [],
      };
      state.customers.push(customer);
    }
    if (!customer.orderIds.includes(order.id)) customer.orderIds.push(order.id);
    return customer;
  }

  function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function initShop() {
    const state = loadState();
    const form = document.querySelector("#orderForm");
    const categoryOptions = document.querySelector("#categoryOptions");
    const budget = document.querySelector("#budget");
    const referenceImageField = document.querySelector("#referenceImageField");
    const deliveryArea = document.querySelector("#deliveryArea");
    const completePanel = document.querySelector("#completePanel");
    const availableProducts = state.products.filter((product) => product.visible && product.available);
    const pickupTime = document.querySelector("#pickupTime");

    categoryOptions.innerHTML = availableProducts
      .map(
        (product, index) => `
          <label class="option-card">
            <input type="radio" name="category" value="${product.id}" ${index === 0 ? "checked" : ""} required />
            <img class="option-image" src="${product.imageUrl}" alt="${product.name} 대표 이미지" loading="lazy" />
            <strong>${product.name}</strong>
            <span>${product.description}</span>
          </label>
        `,
      )
      .join("");

    deliveryArea.innerHTML = state.deliveryAreas
      .map(
        (area) =>
          `<option value="${area.id}" ${area.available ? "" : "disabled"}>${area.name}${area.available ? ` / ${money(area.fee)}` : " / 상담"}</option>`,
      )
      .join("");

    pickupTime.innerHTML = buildPickupTimes()
      .map((time) => `<option value="${time}">${time}</option>`)
      .join("");
    form.receiveDate.min = today();

    function selectedProduct() {
      const id = form.category.value;
      return state.products.find((product) => product.id === id);
    }

    function updateBudget() {
      const product = selectedProduct();
      budget.innerHTML = product.budgets
        .filter((value) => value >= product.minBudget)
        .map((value) => `<option value="${value}">${money(value)}</option>`)
        .join("");
      if (product.id === "custom") {
        budget.innerHTML = `<option value="0">상담 후 안내</option>`;
      }
      referenceImageField.classList.toggle("hidden", product.id !== "custom");
    }

    function updateFulfillment() {
      const isDelivery = form.fulfillment.value === "delivery";
      const deliveryFields = [
        "deliverySlotField",
        "deliveryAreaField",
        "deliveryAddressField",
        "deliveryRequestField",
        "recipientNameField",
        "recipientPhoneField",
      ];
      document.querySelector("#pickupTimeField").classList.toggle("hidden", isDelivery);
      form.pickupTime.required = !isDelivery;
      form.deliverySlot.required = isDelivery;
      form.deliveryArea.required = isDelivery;
      form.deliveryAddress.required = isDelivery;
      form.recipientName.required = isDelivery;
      form.recipientPhone.required = isDelivery;
      deliveryFields.forEach((id) => document.querySelector(`#${id}`).classList.toggle("hidden", !isDelivery));
    }

    categoryOptions.addEventListener("change", updateBudget);
    form.fulfillment.forEach((input) => input.addEventListener("change", updateFulfillment));
    updateBudget();
    updateFulfillment();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = getFormData(form);
      const product = state.products.find((item) => item.id === data.category);
      const area = state.deliveryAreas.find((item) => item.id === data.deliveryArea);
      const order = {
        id: crypto.randomUUID(),
        number: orderNumber(),
        status: "접수",
        paid: false,
        createdAt: new Date().toISOString(),
        category: product.name,
        categoryId: product.id,
        budget: Number(data.budget),
        color: data.color,
        mood: data.mood,
        occasion: data.occasion,
        cardMessage: data.cardMessage || "",
        referenceImageName: form.referenceImage.files[0]?.name || "",
        fulfillment: data.fulfillment,
        receiveDate: data.receiveDate,
        receiveTime: data.fulfillment === "pickup" ? data.pickupTime : data.deliverySlot,
        deliveryArea: area?.name || "",
        deliveryFee: data.fulfillment === "delivery" ? area?.fee || 0 : 0,
        deliveryAddress: data.deliveryAddress || "",
        deliveryRequest: data.deliveryRequest || "",
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        recipientName: data.recipientName || "",
        recipientPhone: data.recipientPhone || "",
        requestNote: data.requestNote || "",
        orderMemo: "",
      };

      state.orders.unshift(order);
      upsertCustomer(state, order);
      notify(state, "고객", `${order.number} 주문 접수 완료. 관리자 확인 후 확정됩니다.`);
      notify(state, "관리자", `${order.number} 신규 주문이 접수되었습니다.`);
      saveState(state);
      form.reset();
      updateBudget();
      updateFulfillment();
      completePanel.classList.remove("hidden");
      completePanel.scrollIntoView({ behavior: "smooth" });
    });
  }

  function initAdmin() {
    const state = loadState();
    const roleSelect = document.querySelector("#roleSelect");
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
        tab.classList.add("active");
        document.querySelector(`#${tab.dataset.tab}`).classList.remove("hidden");
      });
    });

    document.querySelector("#seedOrder").addEventListener("click", () => {
      const order = {
        id: crypto.randomUUID(),
        number: orderNumber(),
        status: "접수",
        paid: false,
        createdAt: new Date().toISOString(),
        category: "꽃다발",
        categoryId: "bouquet",
        budget: 50000,
        color: "핑크",
        mood: "화사한",
        occasion: "기념일",
        cardMessage: "늘 고마워요.",
        referenceImageName: "",
        fulfillment: "pickup",
        receiveDate: today(),
        receiveTime: "14:00",
        deliveryArea: "",
        deliveryFee: 0,
        deliveryAddress: "",
        deliveryRequest: "",
        customerName: "김민지",
        customerPhone: "010-1234-5678",
        recipientName: "",
        recipientPhone: "",
        requestNote: "핑크톤으로 풍성하게 부탁드립니다.",
        orderMemo: "",
      };
      state.orders.unshift(order);
      upsertCustomer(state, order);
      notify(state, "관리자", `${order.number} 샘플 주문이 생성되었습니다.`);
      saveState(state);
      renderAll();
    });

    document.querySelector("#statusFilter").innerHTML = ["전체", "접수", "확인중", "확정", "완료", "취소"]
      .map((item) => `<option>${item}</option>`)
      .join("");
    document.querySelector("#fulfillmentFilter").innerHTML = [
      ["all", "전체"],
      ["pickup", "픽업"],
      ["delivery", "배송"],
    ]
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");

    ["statusFilter", "dateFilter", "fulfillmentFilter"].forEach((id) =>
      document.querySelector(`#${id}`).addEventListener("input", renderOrders),
    );
    roleSelect.addEventListener("change", renderProducts);

    function filteredOrders() {
      const status = document.querySelector("#statusFilter").value;
      const date = document.querySelector("#dateFilter").value;
      const fulfillment = document.querySelector("#fulfillmentFilter").value;
      return state.orders.filter((order) => {
        if (status !== "전체" && order.status !== status) return false;
        if (date && order.receiveDate !== date) return false;
        if (fulfillment !== "all" && order.fulfillment !== fulfillment) return false;
        return true;
      });
    }

    function renderMetrics() {
      const completedThisMonth = state.orders.filter(
        (order) => order.status === "완료" && order.receiveDate.startsWith(today().slice(0, 7)),
      );
      const metrics = [
        ["오늘 수령", state.orders.filter((order) => order.receiveDate === today()).length],
        ["내일 수령", state.orders.filter((order) => order.receiveDate === tomorrow()).length],
        ["신규 접수", state.orders.filter((order) => order.status === "접수").length],
        ["이번 달 완료 금액", money(completedThisMonth.reduce((sum, order) => sum + order.budget + order.deliveryFee, 0))],
        ["취소 주문", state.orders.filter((order) => order.status === "취소").length],
      ];
      document.querySelector("#metrics").innerHTML = metrics
        .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
        .join("");
    }

    function renderCalendar() {
      const slots = ["09:00~11:00", "11:00~13:00", "13:00~15:00", "15:00~17:00", "17:00~18:00", "정확한 시간"];
      const todaysOrders = state.orders.filter((order) => order.receiveDate === today());
      document.querySelector("#calendarView").innerHTML =
        slots
          .map((slot) => {
            const orders =
              slot === "정확한 시간"
        ? todaysOrders.filter((order) => order.fulfillment === "pickup")
                : todaysOrders.filter((order) => order.receiveTime === slot);
            return `<div class="calendar-slot"><strong>${slot}</strong><p>${orders
              .map((order) => `${order.receiveTime} ${order.category} ${order.customerName} (${order.status})`)
              .join("<br>") || "주문 없음"}</p></div>`;
          })
          .join("");
    }

    function renderOrders() {
      const list = document.querySelector("#orderList");
      const orders = filteredOrders();
      list.innerHTML =
        orders
          .map(
            (order) => `
              <article class="row ${order.id === selectedOrderId ? "active" : ""}" data-order-id="${order.id}">
                <div class="row-head">
                  <strong>${order.number}</strong>
                  <span class="badge ${order.status === "확정" || order.status === "완료" ? "green" : "warn"}">${order.status}</span>
                </div>
                <p>${order.receiveDate} ${order.receiveTime} · ${order.category} · ${order.customerName}</p>
              </article>
            `,
          )
          .join("") || `<div class="panel">조건에 맞는 주문이 없습니다.</div>`;
      list.querySelectorAll("[data-order-id]").forEach((row) =>
        row.addEventListener("click", () => {
          selectedOrderId = row.dataset.orderId;
          renderOrders();
          renderOrderDetail();
        }),
      );
      renderOrderDetail();
    }

    function renderOrderDetail() {
      const detail = document.querySelector("#orderDetail");
      const order = state.orders.find((item) => item.id === selectedOrderId);
      if (!order) {
        detail.className = "panel detail empty";
        detail.textContent = "주문을 선택하세요.";
        return;
      }
      detail.className = "panel detail";
      const customer = state.customers.find((item) => item.key === `${order.customerName}|${order.customerPhone}`);
      detail.innerHTML = `
        <h2>${order.number}</h2>
        <div class="detail-grid">
          ${field("상태", order.status)}
          ${field("입금", order.paid ? "확인" : "미확인")}
          ${field("상품", order.category)}
          ${field("예산", money(order.budget))}
          ${field("색감", order.color)}
          ${field("분위기", order.mood)}
          ${field("용도", order.occasion)}
          ${field("수령", `${order.fulfillment === "pickup" ? "픽업" : "배송"} / ${order.receiveDate} ${order.receiveTime}`)}
          ${field("고객", `${order.customerName} / ${order.customerPhone}`)}
          ${field("배송", order.deliveryAddress || "-")}
          ${field("카드 문구", order.cardMessage || "-")}
          ${field("참고 사진", order.referenceImageName || "-")}
        </div>
        <label class="wide">주문 메모<textarea id="orderMemo" rows="3">${order.orderMemo || ""}</textarea></label>
        <label class="wide">고객 메모<textarea id="customerMemo" rows="3">${customer?.memo || ""}</textarea></label>
        <div class="actions">
          ${["접수", "확인중", "확정", "완료", "취소"].map((status) => `<button class="secondary" data-status="${status}">${status}</button>`).join("")}
          <button class="secondary" id="togglePaid">${order.paid ? "입금 취소" : "입금 확인"}</button>
          <button class="primary" id="saveMemo">메모 저장</button>
        </div>
      `;
      detail.querySelectorAll("[data-status]").forEach((button) =>
        button.addEventListener("click", () => {
          order.status = button.dataset.status;
          notify(state, "관리자", `${order.number} 상태가 ${order.status}(으)로 변경되었습니다.`);
          saveState(state);
          renderAll();
        }),
      );
      detail.querySelector("#togglePaid").addEventListener("click", () => {
        order.paid = !order.paid;
        saveState(state);
        renderAll();
      });
      detail.querySelector("#saveMemo").addEventListener("click", () => {
        order.orderMemo = detail.querySelector("#orderMemo").value;
        if (customer) customer.memo = detail.querySelector("#customerMemo").value;
        saveState(state);
        renderAll();
      });
    }

    function field(label, value) {
      return `<div class="field"><span>${label}</span>${value}</div>`;
    }

    function renderProducts() {
      const isStaff = roleSelect.value === "staff";
      document.querySelector("#productList").innerHTML = state.products
        .map(
          (product) => `
            <article class="row">
              <div class="row-head">
                <div class="product-title">
                  <img class="product-thumb" src="${product.imageUrl}" alt="${product.name} 대표 이미지" loading="lazy" />
                  <strong>${product.name}</strong>
                </div>
                <span class="badge ${product.available ? "green" : "warn"}">${product.available ? "판매 가능" : "판매 중지"}</span>
              </div>
              <p>${product.description} · 최소 ${money(product.minBudget)} · 가격대 ${product.budgets.map(money).join(", ")}</p>
              <div class="product-actions">
                <label>상품명<input data-product="${product.id}" data-field="name" value="${product.name}" ${isStaff ? "disabled" : ""}></label>
                <label>설명<input data-product="${product.id}" data-field="description" value="${product.description}" ${isStaff ? "disabled" : ""}></label>
                <label>최소 금액<input data-product="${product.id}" data-field="minBudget" type="number" value="${product.minBudget}" ${isStaff ? "disabled" : ""}></label>
                <label>이미지 경로<input data-product="${product.id}" data-field="imageUrl" value="${product.imageUrl}" ${isStaff ? "disabled" : ""}></label>
                <label>판매 가능
                  <select data-product="${product.id}" data-field="available">
                    <option value="true" ${product.available ? "selected" : ""}>가능</option>
                    <option value="false" ${!product.available ? "selected" : ""}>중지</option>
                  </select>
                </label>
              </div>
            </article>
          `,
        )
        .join("");
      document.querySelectorAll("[data-product]").forEach((input) =>
        input.addEventListener("change", () => {
          const product = state.products.find((item) => item.id === input.dataset.product);
          const fieldName = input.dataset.field;
          if (roleSelect.value === "staff" && fieldName !== "available") return;
          product[fieldName] = fieldName === "available" ? input.value === "true" : fieldName === "minBudget" ? Number(input.value) : input.value;
          saveState(state);
          renderProducts();
        }),
      );
    }

    function renderCustomers() {
      document.querySelector("#customerList").innerHTML =
        state.customers
          .map((customer) => {
            const orders = state.orders.filter((order) => customer.orderIds.includes(order.id));
            const recent = orders.map((order) => order.receiveDate).sort().at(-1) || "-";
            return `
              <article class="row">
                <div class="row-head"><strong>${customer.name}</strong><span class="badge">${orders.length}건</span></div>
                <p>${customer.phone} · 최근 주문 ${recent}</p>
                <label>태그<input data-customer="${customer.id}" data-field="tags" value="${customer.tags.join(", ")}" placeholder="단골, VIP"></label>
                <label>고객 메모<textarea data-customer="${customer.id}" data-field="memo" rows="2">${customer.memo || ""}</textarea></label>
              </article>
            `;
          })
          .join("") || `<div class="panel">고객 이력이 없습니다.</div>`;
      document.querySelectorAll("[data-customer]").forEach((input) =>
        input.addEventListener("change", () => {
          const customer = state.customers.find((item) => item.id === input.dataset.customer);
          if (input.dataset.field === "tags") {
            customer.tags = input.value.split(",").map((tag) => tag.trim()).filter(Boolean);
          } else {
            customer.memo = input.value;
          }
          saveState(state);
          renderCustomers();
        }),
      );
    }

    function renderNotifications() {
      document.querySelector("#notificationList").innerHTML =
        state.notifications
          .map(
            (log) => `
              <article class="row">
                <div class="row-head"><strong>${log.target}</strong><span class="badge ${log.status === "success" ? "green" : "warn"}">${log.status}</span></div>
                <p>${log.message}<br>${log.createdAt}</p>
              </article>
            `,
          )
          .join("") || `<div class="panel">알림 로그가 없습니다.</div>`;
    }

    function renderAll() {
      renderMetrics();
      renderCalendar();
      renderOrders();
      renderProducts();
      renderCustomers();
      renderNotifications();
    }

    renderAll();
  }

  function buildPickupTimes() {
    const times = [];
    for (let hour = 9; hour <= 18; hour += 1) {
      ["00", "30"].forEach((minute) => {
        if (hour === 18 && minute === "30") return;
        times.push(`${String(hour).padStart(2, "0")}:${minute}`);
      });
    }
    return times;
  }

  const page = document.body.dataset.page;
  if (page === "shop") initShop();
  if (page === "admin") initAdmin();
})();
