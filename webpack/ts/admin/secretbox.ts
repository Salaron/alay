import $ from "jquery"
import { secretboxType } from "../../../src/models/secretbox"
import { formatString, sendRequest, showNotification } from "../utils"

enum costType {
  LOVECA = 1,
  ITEM,
  COINS,
  SOCIAL_POINTS
}

$(() => {
  $("#sb-type").change(function () {
    $(".appeal").removeAttr("hidden")
    const type = parseInt(<string>$(this).val())
    if (type === secretboxType.STUB) {
      $(".appeal").attr("hidden", "true")
    }
  })

  $("#addAssets").click(event => {
    $("#assets").removeAttr("hidden")
    const template = $("#assetsTemplate").html()
    const id = $("#assets").find(".secretbox-assets").length
    $("#assets").append(formatString(template, {
      id
    }))
  })

  $("#addButton").click(event => {
    $("#buttons").removeAttr("hidden")
    const buttonTemplate = $("#buttonTemplate").html()
    const secretboxName = $("#sb-name").val()
    const buttonNumber = $("#buttons").find(".secretbox-button").length
    $("#buttons").append(formatString(buttonTemplate, {
      name: secretboxName,
      button: buttonNumber
    }))

    $(`#addButtonCost-${buttonNumber}`).click(event => {
      const costNumber = $(`#costList-${buttonNumber}`).find(".secretbox-cost").length
      let costTemplate = $("#costTemplate").html()
      if (costNumber !== 0)
        costTemplate = "<hr>" + costTemplate
      $("#costList-" + buttonNumber).append(formatString(costTemplate, {
        button: buttonNumber,
        cost: costNumber
      }))

      $(`#sb-cost-type-${buttonNumber}-${costNumber}`).change(function () {
        if (parseInt(<string>$(this).val()) === costType.ITEM) {
          $(`#sb-cost-item-selector-${buttonNumber}-${costNumber}`).removeAttr("hidden")
        } else {
          $(`#sb-cost-item-selector-${buttonNumber}-${costNumber}`).attr("hidden", "true")
        }
      })
    })
  })

  $("#addGroup").click(event => {
    $("#groups").removeAttr("hidden")
    const groupTemplate = $("#groupTemplate").html()
    const groupId = $("#groups").find(".secretbox-group").length
    $("#groups").append(formatString(groupTemplate, {
      id: groupId
    }))

    $("#addFamily-" + groupId).click(event => {
      const familyId = $("#familyList-" + groupId).find(".group-family").length
      let familyTemplate = $("#familyTemplate").html()
      if (familyId !== 0)
        familyTemplate = "<hr>" + familyTemplate
      $("#familyList-" + groupId).append(formatString(familyTemplate, {
        group: groupId,
        family: familyId
      }))
    })
  })

  $("#addGuarantee").click(event => {
    $("#guarantee").removeAttr("hidden")
    const guaranteeTemplate = $("#guaranteeTemplate").html()
    const id = $("#guarantee").find(".secretbox-guarantee").length
    $("#guarantee").append(formatString(guaranteeTemplate, {
      id
    }))
  })

  $("#main-form").submit(async form => {
    form.preventDefault()

    const secretboxName = $("#sb-name").val()
    const secretboxType = parseInt(<string>$("#sb-type").val())
    const memberCategory = parseInt(<string>$("#sb-member-category").val())
    const startDate = $("#sb-start-date").val()
    const endDate = $("#sb-end-date").val()
    const alwaysDisplayFlag = Number($("#sb-always-display-flag").is(":checked"))
    const showEndDateFlag = Number($("#sb-show-end-date-flag").is(":checked"))

    const assets = []
    for (let a = 0; a < $("#assets").find(".secretbox-assets").length; a++) {
      const animationType = parseInt(<string>$("#sb-anim-" + a).val())
      const menu = $("#sb-menu-" + a).val()
      const menuSe = $("#sb-menu-se-" + a).val()
      const background = $("#sb-bg-" + a).val()
      const navi = $("#sb-navi-" + a).val()
      const title = $("#sb-title-" + a).val()
      const appeal = $("#sb-appeal-" + a).val()
      assets.push({
        animationType,
        menu,
        menuSe,
        background,
        navi,
        title,
        appeal
      })
    }


    const buttons = []
    for (let b = 0; b < $("#buttons").find(".secretbox-button").length; b++) {
      const name = $("#sb-button-name-" + b).val()
      const type = parseInt(<string>$("#sb-button-type-" + b).val())
      const balloon = $("#sb-button-balloon-" + b).val()

      let costs = []
      for (let c = 0; c < $(`#costList-${b}`).find(".secretbox-cost").length; c++) {
        const item = parseInt(<string>$(`#sb-cost-type-${b}-${c}`).val())

        let type = 0
        let itemId: number | null = null
        switch(item) {
          case costType.ITEM: {
            type = 1000
            itemId = parseInt(<string>$(`#sb-cost-item-${b}-${c}`).val())
          }
          case costType.COINS: {
            type = 3000
          }
          case costType.LOVECA: {
            type = 3001
            break
          }
          case costType.SOCIAL_POINTS: {
            type = 3002
          }
        }

        const amount = parseInt(<string>$(`#sb-cost-amount-${b}-${c}`).val())
        const cardCount = parseInt(<string>$(`#sb-cost-card-cnt-${b}-${c}`).val())
        const hideFlag = Number($(`#sb-cost-hide-${b}-${c}`).is(":checked"))
        costs.push({
          type,
          itemId,
          amount,
          cardCount,
          hideFlag
        })
      }
      buttons.push({
        name,
        type,
        balloon,
        costs
      })
    }

    const groups = []
    for (let g = 0; g < $("#groups").find(".secretbox-group").length; g++) {
      const rarity = parseInt(<string>$("#sb-group-rarity-" + g).val())
      const weight = parseInt(<string>$("#sb-group-weight-" + g).val())
      let family = []
      for (let f = 0; f < $("#familyList-" + g).find(".group-family").length; f++) {
        const familyWeight = parseInt(<string>$(`#sb-family-weight-${g}-${f}`).val())
        const query = $(`#sb-family-query-${g}-${f}`).val()
        family.push({
          weight: familyWeight,
          query
        })
      }
      groups.push({
        rarity,
        weight,
        family
      })
    }

    const guarantee = []
    for (let g = 0; g < $("#guarantee").find(".secretbox-guarantee").length; g++) {
      const rarity = parseInt(<string>$("#sb-guarantee-rarity-" + g).val())
      const count = parseInt(<string>$("#sb-guarantee-count-" + g).val())
      guarantee.push({
        rarity,
        count
      })
    }
    const requestData = {
      secretboxInfo: {
        secretboxName,
        secretboxType,
        startDate,
        endDate,
        memberCategory,
        alwaysDisplayFlag,
        showEndDateFlag
      },
      assets,
      buttons,
      groups,
      guarantee
    }

    const response = await sendRequest("admin/addSecretbox", requestData)
    showNotification("Успех! ID новой коробки: " + response.id)
  })
})