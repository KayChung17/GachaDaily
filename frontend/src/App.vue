<script setup>
import { onMounted } from "vue";

onMounted(async () => {
  const envApiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const isLocalDevHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const apiBase = envApiBase || (isLocalDevHost ? "http://127.0.0.1:8056" : "");
  window.__GACHA_DAILY_API_BASE__ = apiBase;
  const { initGachaDaily } = await import("./legacy/initGachaDaily.js");
  initGachaDaily();
});
</script>

<template>
  <div class="gacha-daily-app">
    <div
      id="bg-tasks"
      class="global-bg is-active"
      style="background-image: url('/img/input_file_1.png')"
    ></div>
    <div
      id="bg-cards"
      class="global-bg"
      style="background-image: url('/img/input_file_4.png')"
    ></div>
    <div
      id="bg-settings"
      class="global-bg"
      style="background-image: url('/img/input_file_6.png')"
    ></div>
    <div
      id="bg-minimal"
      class="global-bg"
      style="background-image: url('/img/input_file_0.png')"
    ></div>

    <div class="bg-grid"></div>

    <header class="top-banner">
      <img class="top-banner__image" src="/img/input_file_0.png" alt="标题背景图" />
      <div class="banner-content">
        <img class="banner-title-image" src="/img/title.png" alt="Gacha Daily" />
        <h1><span class="diamond">◆</span> Gacha Daily <span class="diamond">◆</span></h1>
      </div>
    </header>

    <main class="pages">
      <section class="page is-active" data-page="tasks">
        <div class="tasks-layout">
          <section class="tasks-left chiseled-panel glass-panel">
            <div class="panel-inner">
              <div class="panel__header">
                <h2><span class="diamond">◆</span> 任 务 列 表 <span class="diamond">◆</span></h2>
              </div>
              <div class="task-list" id="taskList"></div>
            </div>
          </section>

          <div class="tasks-right">
            <section class="chiseled-panel info-bar">
              <div class="panel-inner bar-inner-center">
                <span class="currency-card__label">CURRENT POINTS / 当前积分</span>
                <div class="currency-card__value-box">
                  <span class="star-icon large">✦</span>
                  <span class="currency-card__value currency-amount">1500</span>
                </div>
              </div>
            </section>

            <section class="chiseled-panel glass-panel">
              <div class="panel-inner">
                <div class="panel__header">
                  <h2><span class="diamond">◆</span> 创 建 任 务 <span class="diamond">◆</span></h2>
                </div>

                <form id="taskForm" class="task-form">
                  <div class="form-group">
                    <label>任务名称</label>
                    <div class="input-wrapper glass-input">
                      <input type="text" id="taskTitle" placeholder="如：研习魔书" required />
                      <span class="input-line"></span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label id="deadlineFieldLabel">截止日期（可选）</label>
                    <div class="date-picker" id="deadlinePicker">
                      <div class="input-wrapper glass-input">
                        <button class="date-picker__button" type="button" id="deadlinePickerButton">
                          <span id="deadlinePickerLabel">不设置截止日期</span>
                          <span class="diamond small">◆</span>
                        </button>
                        <span class="input-line"></span>
                      </div>
                      <input type="hidden" id="taskDeadline" />

                      <div
                        class="calendar-panel chiseled-panel glass-effect"
                        id="calendarPanel"
                        aria-hidden="true"
                      >
                        <div class="calendar-header">
                          <button class="calendar-nav glass-btn" type="button" id="calendarPrev">‹</button>
                          <div class="calendar-title" id="calendarTitle"></div>
                          <button class="calendar-nav glass-btn" type="button" id="calendarNext">›</button>
                        </div>
                        <div class="calendar-weekdays">
                          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span
                          ><span>S</span>
                        </div>
                        <div class="calendar-days" id="calendarDays"></div>
                        <div class="calendar-actions">
                          <button
                            class="btn btn--outline calendar-clear-btn"
                            type="button"
                            id="clearDeadlineButton"
                          >
                            不设置截止日期
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>循环周期</label>
                    <div class="repeat-picker" id="repeatPicker">
                      <div class="input-wrapper glass-input">
                        <button class="date-picker__button" type="button" id="repeatPickerButton">
                          <span id="repeatPickerLabel">不循环</span>
                          <span class="diamond small">◆</span>
                        </button>
                        <span class="input-line"></span>
                      </div>
                      <input type="hidden" id="taskRepeat" value="none" />
                      <div class="repeat-panel chiseled-panel" id="repeatPanel" aria-hidden="true">
                        <div class="panel-inner">
                          <div class="repeat-options">
                            <button type="button" class="repeat-option is-selected" data-repeat="none">
                              不循环
                            </button>
                            <button type="button" class="repeat-option" data-repeat="daily">每天</button>
                            <button type="button" class="repeat-option" data-repeat="weekly">每周</button>
                            <button type="button" class="repeat-option" data-repeat="monthly">每月</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="task-form__row">
                    <div class="form-group flex-1">
                      <label>重要程度</label>
                      <div class="range-wrapper">
                        <input type="range" id="taskImportance" min="1" max="5" value="3" />
                      </div>
                    </div>
                    <div class="form-group flex-1">
                      <label>任务难度</label>
                      <div class="range-wrapper">
                        <input type="range" id="taskDifficulty" min="1" max="5" value="3" />
                      </div>
                    </div>
                  </div>

                  <div class="task-form__footer">
                    <div class="reward-preview">
                      <span class="text-dim">预计奖励积分：</span>
                      <span class="star-icon small">✦</span>
                      <strong id="rewardPreview">50</strong>
                    </div>
                    <button class="btn btn--outline" type="submit">
                      创 建 任 务 <span class="diamond">◆</span>
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section class="page" data-page="cards">
        <section class="gacha-top-row">
          <div class="gacha-center">
            <button id="gachaButton" class="gacha-image-btn" type="button" aria-label="抽卡">
              <img src="/img/chouka.png" alt="抽卡底图" />
            </button>
          </div>
          <section class="chiseled-panel gacha-points-panel">
            <div class="panel-inner">
              <div class="gacha-points">
                <span class="currency-card__label">当前积分</span>
                <div class="currency-card__value-box">
                  <span class="star-icon">✦</span>
                  <span class="currency-card__value currency-amount">1500</span>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section
          class="chiseled-panel glass-panel cards-preview-panel"
          id="cardGalleryOpen"
          role="button"
          tabindex="0"
          aria-label="打开卡面展示墙"
        >
          <div class="panel-inner">
            <div class="panel__header">
              <h2><span class="diamond">◆</span> 幻 影 回 廊 <span class="diamond">◆</span></h2>
            </div>
            <div id="cardPreview" class="card-preview-grid"></div>
          </div>
        </section>
      </section>

      <section class="page" data-page="settings">
        <section class="chiseled-panel glass-panel">
          <div class="panel-inner">
            <div class="panel__header">
              <h2><span class="diamond">◆</span> 配 置 <span class="diamond">◆</span></h2>
              <p>配置 RSS 与数据同步</p>
            </div>

            <div class="form-group">
              <label>主题模式</label>
              <div class="theme-picker" id="themePicker">
                <div class="input-wrapper glass-input">
                  <button class="date-picker__button" type="button" id="themePickerButton">
                    <span id="themePickerLabel">华丽</span>
                    <span class="diamond small">◆</span>
                  </button>
                  <span class="input-line"></span>
                </div>
                <input type="hidden" id="themeMode" value="gorgeous" />
                <div class="theme-panel chiseled-panel" id="themePanel" aria-hidden="true">
                  <div class="panel-inner">
                    <div class="theme-options">
                      <button type="button" class="theme-option is-selected" data-theme="gorgeous">华丽</button>
                      <button type="button" class="theme-option" data-theme="minimal">简约</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>RSS 地址（目前仅支持解析pixiv）</label>
              <div class="input-wrapper glass-input">
                <input type="url" id="rssUrl" placeholder="/api/rss" />
                <span class="input-line"></span>
              </div>
            </div>
            <div class="settings-actions">
              <button id="rssSyncButton" class="btn btn--hollow" type="button">同步 RSS 到卡池</button>
              <span class="hint-text">※ 默认走 FastAPI 的 /api/rss 代理</span>
            </div>

            <hr class="cyber-divider" />

            <div class="panel__header small">
              <h3><span class="diamond">◆</span> 数 据 同 步 <span class="diamond">◆</span></h3>
              <p>与本地/远程同步服务交换数据</p>
            </div>

            <div class="task-form__row">
              <div class="form-group flex-1">
                <label>同步地址 (Sync URL)</label>
                <div class="input-wrapper glass-input">
                  <input type="url" id="syncUrl" placeholder="/api/sync" />
                  <span class="input-line"></span>
                </div>
              </div>
              <div class="form-group flex-1">
                <label>访问令牌 (Token)</label>
                <div class="input-wrapper glass-input">
                  <input type="password" id="syncToken" placeholder="输入访问令牌" />
                  <span class="input-line"></span>
                </div>
              </div>
            </div>

            <div class="settings-actions">
              <button id="syncPullButton" class="btn btn--outline" type="button">拉取</button>
              <button id="syncPushButton" class="btn btn--outline" type="button">上传</button>
              <span class="hint-text" id="syncStatus">状态：未同步</span>
            </div>
          </div>
        </section>
      </section>
    </main>

    <section class="card-gallery-modal" id="cardGalleryModal" aria-hidden="true">
      <div class="card-gallery-shell chiseled-panel glass-panel">
        <div class="panel-inner">
          <div class="panel__header">
            <h2><span class="diamond">◆</span> 卡 面 展 示 墙 <span class="diamond">◆</span></h2>
            <p>已获得卡面</p>
          </div>
          <div id="cardWall" class="card-wall"></div>
          <div id="cardZoom" class="card-zoom" aria-hidden="true">
            <button id="cardZoomClose" class="card-zoom-close" type="button" aria-label="关闭大图">×</button>
            <img id="cardZoomImage" class="card-zoom-image" src="" alt="卡面大图" />
          </div>
        </div>
      </div>
    </section>

    <section class="gacha-reveal-modal" id="gachaRevealModal" aria-hidden="true">
      <div class="gacha-reveal-stage">
        <button id="gachaRevealClose" class="gacha-reveal-close" type="button" aria-label="关闭抽卡结果">
          ×
        </button>
        <img id="gachaRevealImage" class="gacha-reveal-image" src="/img/chouka.png" alt="抽卡结果" />
        <div id="gachaRevealName" class="gacha-reveal-name"></div>
      </div>
    </section>

    <nav class="bottom-bar glass-effect" aria-label="页面切换">
      <button class="bottom-bar__item is-active" data-target="tasks" type="button">
        <span class="diamond nav-icon">◆</span> 任务
      </button>
      <div class="nav-separator"></div>
      <button class="bottom-bar__item" data-target="cards" type="button">
        <span class="diamond nav-icon">◆</span> 卡面
      </button>
      <div class="nav-separator"></div>
      <button class="bottom-bar__item" data-target="settings" type="button">
        <span class="diamond nav-icon">◆</span> 设置
      </button>
    </nav>
  </div>
</template>
