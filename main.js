const nightmareToggle = $("#nightmare-toggle");
const hideExcludedToggle = $("#hide-excluded-toggle")

const possessionButtons = $("#possession-buttons").children();
const possessionHints = $("#possession-hints").children();

const evidenceButtons = $("#evidence-buttons .button");
const ghosts = $(".ghost");
const ghostEvidences = $(".ghost .evidence");
const ghostSheet = $("#journal-minimap");

const body = $("body");
const bottomContent = $("#bottom-content");

evidenceButtons.each(function() {
    $(this).prop('title', 'Left-click to include.\nRight-click to exclude.');
});

function writeCookie(name, value) {
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = d.toUTCString();
    document.cookie = name + "=" + value + ";" + "expires=" + expires + ";path=/";
}

function readCookie(name) {
    const cname = name + "=";
    const dc = decodeURIComponent(document.cookie);
    const ca = dc.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

function loadSettings() {
    if (readCookie("hide-excluded-toggle") === "True") {
        body.addClass("hide-excluded-toggle")
        hideExcludedToggle.addClass("active");
    }
}

function reset() {
    ghosts.removeClass("disabled positive excluded manual-excluded");
    ghostEvidences.children("li").removeClass("positive negative");
    evidenceButtons.removeClass("disabled positive negative");
    body.removeClass("positive negative");
    ghostSheet.addClass("disabled");
}

$("#reset").on("click", reset);

$(document).on("keypress", function (e) {
    if (e.key === "r") {
        reset();
    }
});

$(".toggle").on("click", function () {
    $(this).toggleClass("active");
});

nightmareToggle.on("click", function () {
    body.toggleClass("nightmare");
    updateGhosts();
});

$(document).on("keypress", function (e) {
    if (e.key === "q") {
        body.toggleClass("nightmare");
        nightmareToggle.toggleClass("active")
        updateGhosts();
    }
});

function updateGhosts() {
    const foundEvidence = $("#evidence-buttons .button.positive[data-evidence]").map((i, e) => e.getAttribute("data-evidence")).get();
    const foundExtras = $("#evidence-buttons .button.positive[data-evidence-extra]").map((i, e) => e.getAttribute("data-evidence-extra")).get();
    const nightmare = nightmareToggle.hasClass("active");

    // Check the evidence list of each ghost
    // Hide any ghosts that do not contain all currently discovered evidence
    // Fade any ghosts that can be ruled out based on excluded evidence
    const positives = $(".evidence .positive[data-evidence]");
    const negatives = $(".evidence .negative[data-evidence]");
    const positivesExtra = $(".evidence .positive[data-evidence-extra]");
    const negativesExtra = $(".evidence .negative[data-evidence-extra]");
    const negativesRequired = $(".evidence .negative[required='true']");
    ghostEvidences.each(function () {
        const $this = $(this);
        const ghost= $this.parents(".ghost");
        const requiredEvidence= $this.find($("[required='true']"));
        ghost.removeClass("excluded");
        if (nightmare && foundEvidence.length === 2 && requiredEvidence.length > 0 && !requiredEvidence.hasClass("positive")) {
            ghost.addClass("disabled");
        } else if ($this.find(positives).length !== foundEvidence.length) {
            ghost.addClass("disabled");
        } else if ($this.find(positivesExtra).length !== foundExtras.length) {
            ghost.addClass("disabled");
        } else if ($this.find(negatives).length > (nightmare ? 1 : 0) || $this.find(negativesRequired).length > 0 || $this.find(negativesExtra).length > 0) {
            // In nightmare difficulty one piece of evidence is hidden, so a ghost can only be ruled out if
            // two pieces of evidence are excluded OR if a required piece of evidence is excluded
            ghost.addClass("excluded");
            ghost.removeClass("disabled");
        } else {
            ghost.removeClass("disabled");
        }

        requiredEvidence.each(function () {
            $(this).prop('title', nightmare ? 'In nightmare difficulty, this piece of evidence is guaranteed for this ghost.' : '');
        })
    });

    $(".ghost.manual-excluded").addClass("excluded");

    const validEvidence = $(".ghost:not(.disabled):not(.excluded) .evidence li")
        .map((i, e) => e.getAttribute("data-evidence") ?? e.getAttribute("data-evidence-extra")).get()
        .filter((value, index, self) => self.indexOf(value) === index);

    const excludedEvidence = $(".ghost:not(.disabled).excluded .evidence li.negative")
        .map((i, e) => e.getAttribute("data-evidence") ?? e.getAttribute("data-evidence-extra")).get()
        .filter((value, index, self) => self.indexOf(value) === index);

    $("#evidence-buttons .button:not(.positive)").each(function () {
        const $this = $(this);
        const evidence = $this.data("evidence") ?? $this.data("evidence-extra");
        if (!validEvidence.includes(evidence) && !excludedEvidence.includes(evidence))
            $this.addClass("disabled");
        else
            $this.removeClass("disabled");
    });

    const ghost = $(".ghost:not(.excluded):not(.disabled)");
    if (ghost.length === 0) {
        body.removeClass("positive");
        body.addClass("negative");
        ghostSheet.addClass("disabled");
    }
    else if (ghost.length === 1) {
        ghost.addClass("positive");
        body.removeClass("negative");
        body.addClass("positive");
        ghostSheet.removeClass("disabled");
        
        const ghostName = ghost.find("h3").text();
        ghostSheet.find(".positive").removeClass("positive");
        ghostSheet.find(`td:contains(${ghostName})`).addClass("positive");
    }
    else {
        ghost.removeClass("positive")
        body.removeClass("positive negative");
        ghostSheet.addClass("disabled");
    }
}

possessionButtons.on("click", function () {
    possessionButtons.not(this).removeClass("active");

    possessionHints.addClass("disabled");
    
    const container = $("#possession-hints");
    container.addClass("disabled");
    bottomContent[0].style.marginTop = "0px";

    if ($(this).hasClass("active"))
    {
        possessionHints.eq(possessionButtons.index(this)).removeClass("disabled");
        container.removeClass("disabled");
        bottomContent[0].style.marginTop = (container[0].clientHeight) + "px";
    }
});

hideExcludedToggle.on("click", function () {
    if (body.hasClass("hide-excluded-toggle")) {
        body.removeClass("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "False")
    } else {
        body.addClass("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "True")
    }

    updateGhosts();
});

evidenceButtons.on("click", function () {
    const $this = $(this);
    
    let changedGhostEvidences;
    let changedEvidence = $this.data("evidence");
    if (changedEvidence != null)
        changedGhostEvidences = $(`.evidence > li[data-evidence=${changedEvidence}]`);
    else {
        changedEvidence = $this.data("evidence-extra");
        changedGhostEvidences = $(`.evidence > li[data-evidence-extra=${changedEvidence}]`);
    }

    if (!$this.hasClass("positive")) {
        $this.removeClass("negative");
        $this.addClass("positive");
        changedGhostEvidences.removeClass("negative");
        changedGhostEvidences.addClass("positive");
    } else {
        $this.removeClass("positive negative");
        changedGhostEvidences.removeClass("positive negative");
    }

    updateGhosts();
});

evidenceButtons.on("contextmenu", function (e) {
    e.preventDefault();

    const $this = $(this);

    let changedGhostEvidences;
    let changedEvidence = $this.data("evidence");
    if (changedEvidence != null)
        changedGhostEvidences = $(`.evidence > li[data-evidence=${changedEvidence}]`);
    else {
        changedEvidence = $this.data("evidence-extra");
        changedGhostEvidences = $(`.evidence > li[data-evidence-extra=${changedEvidence}]`);
    }

    if (!$this.hasClass("negative")) {
        $this.removeClass("positive");
        $this.addClass("negative");
        changedGhostEvidences.removeClass("positive");
        changedGhostEvidences.addClass("negative");
    } else {
        $this.removeClass("positive negative");
        changedGhostEvidences.removeClass("positive negative");
    }

    updateGhosts();
});

const ghostHeaders = $(".ghost h3");
ghostHeaders.on("click", function () {
    $(this).parents(".ghost").toggleClass("manual-excluded");
    updateGhosts();
});

ghostHeaders.on("contextmenu", function (e) {
    e.preventDefault();
    $(this).parents(".ghost").toggleClass("manual-excluded");
    updateGhosts();
});

ghostHeaders.each(function() {
    $(this).prop('title', 'Click to exclude.');
});