import React, { useState, useMemo } from "react";
import { Search, X, Ban, Lock, ArrowLeft, RotateCcw, Undo2, Swords, Trophy, Sparkles, Heart, GripVertical } from "lucide-react";

const HEROES = [{"slug":"annette","name":"Annette","tier":"C","roles":["Roam"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/annette.jpg","url":"https://hokstats.gg/heroes/annette/"},{"slug":"ata","name":"Ata","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/ata.jpg","url":"https://hokstats.gg/heroes/ata/"},{"slug":"butterfly","name":"Butterfly","tier":"B","roles":["Jungle"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/butterfly.jpg","url":"https://hokstats.gg/heroes/butterfly/"},{"slug":"devara","name":"Devara","tier":"A","roles":["Clash Lane"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/devara.jpg","url":"https://hokstats.gg/heroes/devara/"},{"slug":"fatih","name":"Fatih","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/fatih.jpg","url":"https://hokstats.gg/heroes/fatih/"},{"slug":"florentino","name":"Florentino","tier":"S","roles":["Clash Lane"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/florentino.jpg","url":"https://hokstats.gg/heroes/florentino/"},{"slug":"flowborn-mage","name":"Flowborn (Mage)","tier":"C","roles":["Mid"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/flowborn-mage.jpg","url":"https://hokstats.gg/heroes/flowborn-mage/"},{"slug":"flowborn-tank","name":"Flowborn (Tank)","tier":"C","roles":["Clash Lane"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/flowborn-tank.jpg","url":"https://hokstats.gg/heroes/flowborn-tank/"},{"slug":"garuda","name":"Garuda","tier":"B","roles":["Mid"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/garuda.jpg","url":"https://hokstats.gg/heroes/garuda/"},{"slug":"lapulapu","name":"Lapulapu","tier":"C","roles":["Roam"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/lapulapu.jpg","url":"https://hokstats.gg/heroes/lapulapu/"},{"slug":"lorion","name":"Lorion","tier":"A","roles":["Mid"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/lorion.jpg","url":"https://hokstats.gg/heroes/lorion/"},{"slug":"luara","name":"Luara","tier":"A","roles":["Farm"],"intl_exclusive":true,"image":"https://hokstats.gg/heroes-splash/luara.jpg","url":"https://hokstats.gg/heroes/luara/"},{"slug":"agudo","name":"Agudo","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/agudo.jpg","url":"https://hokstats.gg/heroes/agudo/"},{"slug":"alessio","name":"Alessio","tier":"B","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/alessio.jpg","url":"https://hokstats.gg/heroes/alessio/"},{"slug":"allain","name":"Allain","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/allain.jpg","url":"https://hokstats.gg/heroes/allain/"},{"slug":"angela","name":"Angela","tier":"S","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/angela.jpg","url":"https://hokstats.gg/heroes/angela/"},{"slug":"aoyin","name":"Ao'yin","tier":"S","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/aoyin.jpg","url":"https://hokstats.gg/heroes/aoyin/"},{"slug":"arke","name":"Arke","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/arke.jpg","url":"https://hokstats.gg/heroes/arke/"},{"slug":"arli","name":"Arli","tier":"B","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/arli.jpg","url":"https://hokstats.gg/heroes/arli/"},{"slug":"arthur","name":"Arthur","tier":"A","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/arthur.jpg","url":"https://hokstats.gg/heroes/arthur/"},{"slug":"athena","name":"Athena","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/athena.jpg","url":"https://hokstats.gg/heroes/athena/"},{"slug":"augran","name":"Augran","tier":"S","roles":["Jungle","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/augran.jpg","url":"https://hokstats.gg/heroes/augran/"},{"slug":"bai-qi","name":"Bai Qi","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/bai-qi.jpg","url":"https://hokstats.gg/heroes/bai-qi/"},{"slug":"biron","name":"Biron","tier":"B","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/biron.jpg","url":"https://hokstats.gg/heroes/biron/"},{"slug":"cai-yan","name":"Cai Yan","tier":"A","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/cai-yan.jpg","url":"https://hokstats.gg/heroes/cai-yan/"},{"slug":"chano","name":"Chano","tier":"C","roles":["Farm","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/chano.jpg","url":"https://hokstats.gg/heroes/chano/"},{"slug":"charlotte","name":"Charlotte","tier":"B","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/charlotte.jpg","url":"https://hokstats.gg/heroes/charlotte/"},{"slug":"chicha","name":"Chicha","tier":"A","roles":["Clash Lane","Jungle","Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/chicha.jpg","url":"https://hokstats.gg/heroes/chicha/"},{"slug":"cirrus","name":"Cirrus","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/cirrus.jpg","url":"https://hokstats.gg/heroes/cirrus/"},{"slug":"consort-yu","name":"Consort Yu","tier":"A","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/consort-yu.jpg","url":"https://hokstats.gg/heroes/consort-yu/"},{"slug":"da-qiao","name":"Da Qiao","tier":"B","roles":["Roam","Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/da-qiao.jpg","url":"https://hokstats.gg/heroes/da-qiao/"},{"slug":"daji","name":"Daji","tier":"S","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/daji.jpg","url":"https://hokstats.gg/heroes/daji/"},{"slug":"dharma","name":"Dharma","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dharma.jpg","url":"https://hokstats.gg/heroes/dharma/"},{"slug":"di-renjie","name":"Di Renjie","tier":"B","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/di-renjie.jpg","url":"https://hokstats.gg/heroes/di-renjie/"},{"slug":"dian-wei","name":"Dian Wei","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dian-wei.jpg","url":"https://hokstats.gg/heroes/dian-wei/"},{"slug":"diaochan","name":"Diaochan","tier":"B","roles":["Mid","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/diaochan.jpg","url":"https://hokstats.gg/heroes/diaochan/"},{"slug":"dolia","name":"Dolia","tier":"A","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dolia.jpg","url":"https://hokstats.gg/heroes/dolia/"},{"slug":"donghuang","name":"Donghuang","tier":"A","roles":["Roam","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/donghuang.jpg","url":"https://hokstats.gg/heroes/donghuang/"},{"slug":"dr-bian","name":"Dr Bian","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dr-bian.jpg","url":"https://hokstats.gg/heroes/dr-bian/"},{"slug":"dun","name":"Dun","tier":"A","roles":["Clash Lane","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dun.jpg","url":"https://hokstats.gg/heroes/dun/"},{"slug":"dyadia","name":"Dyadia","tier":"A","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/dyadia.jpg","url":"https://hokstats.gg/heroes/dyadia/"},{"slug":"erin","name":"Erin","tier":"A","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/erin.jpg","url":"https://hokstats.gg/heroes/erin/"},{"slug":"fang","name":"Fang","tier":"B","roles":["Farm","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/fang.jpg","url":"https://hokstats.gg/heroes/fang/"},{"slug":"feyd","name":"Feyd","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/feyd.jpg","url":"https://hokstats.gg/heroes/feyd/"},{"slug":"flowborn-marksman","name":"Flowborn (Marksman)","tier":"B","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/flowborn-marksman.jpg","url":"https://hokstats.gg/heroes/flowborn-marksman/"},{"slug":"fuzi","name":"Fuzi","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/fuzi.jpg","url":"https://hokstats.gg/heroes/fuzi/"},{"slug":"gan-mo","name":"Gan & Mo","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/gan-mo.jpg","url":"https://hokstats.gg/heroes/gan-mo/"},{"slug":"gao","name":"Gao","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/gao.jpg","url":"https://hokstats.gg/heroes/gao/"},{"slug":"gao-changgong","name":"Gao Changgong","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/gao-changgong.jpg","url":"https://hokstats.gg/heroes/gao-changgong/"},{"slug":"garo","name":"Garo","tier":"A","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/garo.jpg","url":"https://hokstats.gg/heroes/garo/"},{"slug":"guan-yu","name":"Guan Yu","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/guan-yu.jpg","url":"https://hokstats.gg/heroes/guan-yu/"},{"slug":"guiguzi","name":"Guiguzi","tier":"C","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/guiguzi.jpg","url":"https://hokstats.gg/heroes/guiguzi/"},{"slug":"han-xin","name":"Han Xin","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/han-xin.jpg","url":"https://hokstats.gg/heroes/han-xin/"},{"slug":"haya","name":"Haya","tier":"A","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/haya.jpg","url":"https://hokstats.gg/heroes/haya/"},{"slug":"heino","name":"Heino","tier":"B","roles":["Mid","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/heino.jpg","url":"https://hokstats.gg/heroes/heino/"},{"slug":"hou-yi","name":"Hou Yi","tier":"S","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/hou-yi.jpg","url":"https://hokstats.gg/heroes/hou-yi/"},{"slug":"huang-zhong","name":"Huang Zhong","tier":"C","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/huang-zhong.jpg","url":"https://hokstats.gg/heroes/huang-zhong/"},{"slug":"jing","name":"Jing","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/jing.jpg","url":"https://hokstats.gg/heroes/jing/"},{"slug":"kaizer","name":"Kaizer","tier":"A","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/kaizer.jpg","url":"https://hokstats.gg/heroes/kaizer/"},{"slug":"kongming","name":"Kongming","tier":"A","roles":["Mid","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/kongming.jpg","url":"https://hokstats.gg/heroes/kongming/"},{"slug":"kui","name":"Kui","tier":"B","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/kui.jpg","url":"https://hokstats.gg/heroes/kui/"},{"slug":"lady-sun","name":"Lady Sun","tier":"A","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/lady-sun.jpg","url":"https://hokstats.gg/heroes/lady-sun/"},{"slug":"lady-zhen","name":"Lady Zhen","tier":"B","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/lady-zhen.jpg","url":"https://hokstats.gg/heroes/lady-zhen/"},{"slug":"lam","name":"Lam","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/lam.jpg","url":"https://hokstats.gg/heroes/lam/"},{"slug":"li-bai","name":"Li Bai","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/li-bai.jpg","url":"https://hokstats.gg/heroes/li-bai/"},{"slug":"li-xin","name":"Li Xin","tier":"S","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/li-xin.jpg","url":"https://hokstats.gg/heroes/li-xin/"},{"slug":"lian-po","name":"Lian Po","tier":"B","roles":["Clash Lane","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/lian-po.jpg","url":"https://hokstats.gg/heroes/lian-po/"},{"slug":"liang","name":"Liang","tier":"S","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/liang.jpg","url":"https://hokstats.gg/heroes/liang/"},{"slug":"liu-bang","name":"Liu Bang","tier":"C","roles":["Clash Lane","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/liu-bang.jpg","url":"https://hokstats.gg/heroes/liu-bang/"},{"slug":"liu-bei","name":"Liu Bei","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/liu-bei.jpg","url":"https://hokstats.gg/heroes/liu-bei/"},{"slug":"liu-shan","name":"Liu Shan","tier":"B","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/liu-shan.jpg","url":"https://hokstats.gg/heroes/liu-shan/"},{"slug":"lu-bu","name":"Lu Bu","tier":"B","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/lu-bu.jpg","url":"https://hokstats.gg/heroes/lu-bu/"},{"slug":"luban-no-7","name":"Luban No.7","tier":"S","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/luban-no-7.jpg","url":"https://hokstats.gg/heroes/luban-no-7/"},{"slug":"luna","name":"Luna","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/luna.jpg","url":"https://hokstats.gg/heroes/luna/"},{"slug":"mai-shiranui","name":"Mai Shiranui","tier":"B","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/mai-shiranui.jpg","url":"https://hokstats.gg/heroes/mai-shiranui/"},{"slug":"marco-polo","name":"Marco Polo","tier":"A","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/marco-polo.jpg","url":"https://hokstats.gg/heroes/marco-polo/"},{"slug":"mayene","name":"Mayene","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/mayene.jpg","url":"https://hokstats.gg/heroes/mayene/"},{"slug":"meng-ya","name":"Meng Ya","tier":"C","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/meng-ya.jpg","url":"https://hokstats.gg/heroes/meng-ya/"},{"slug":"menki","name":"Menki","tier":"C","roles":["Jungle","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/menki.jpg","url":"https://hokstats.gg/heroes/menki/"},{"slug":"mi-yue","name":"Mi Yue","tier":"B","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/mi-yue.jpg","url":"https://hokstats.gg/heroes/mi-yue/"},{"slug":"milady","name":"Milady","tier":"S","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/milady.jpg","url":"https://hokstats.gg/heroes/milady/"},{"slug":"ming","name":"Ming","tier":"C","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/ming.jpg","url":"https://hokstats.gg/heroes/ming/"},{"slug":"mozi","name":"Mozi","tier":"A","roles":["Mid","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/mozi.jpg","url":"https://hokstats.gg/heroes/mozi/"},{"slug":"mulan","name":"Mulan","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/mulan.jpg","url":"https://hokstats.gg/heroes/mulan/"},{"slug":"musashi","name":"Musashi","tier":"B","roles":["Jungle","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/musashi.jpg","url":"https://hokstats.gg/heroes/musashi/"},{"slug":"nakoruru","name":"Nakoruru","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/nakoruru.jpg","url":"https://hokstats.gg/heroes/nakoruru/"},{"slug":"nezha","name":"Nezha","tier":"C","roles":["Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/nezha.jpg","url":"https://hokstats.gg/heroes/nezha/"},{"slug":"nuwa","name":"Nuwa","tier":"A","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/nuwa.jpg","url":"https://hokstats.gg/heroes/nuwa/"},{"slug":"pei","name":"Pei","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/pei.jpg","url":"https://hokstats.gg/heroes/pei/"},{"slug":"sakeer","name":"Sakeer","tier":"C","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/sakeer.jpg","url":"https://hokstats.gg/heroes/sakeer/"},{"slug":"shangguan","name":"Shangguan","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/shangguan.jpg","url":"https://hokstats.gg/heroes/shangguan/"},{"slug":"shi","name":"Shi","tier":"B","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/shi.jpg","url":"https://hokstats.gg/heroes/shi/"},{"slug":"shouyue","name":"Shouyue","tier":"B","roles":["Farm"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/shouyue.jpg","url":"https://hokstats.gg/heroes/shouyue/"},{"slug":"sima-yi","name":"Sima Yi","tier":"B","roles":["Jungle","Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/sima-yi.jpg","url":"https://hokstats.gg/heroes/sima-yi/"},{"slug":"sun-bin","name":"Sun Bin","tier":"C","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/sun-bin.jpg","url":"https://hokstats.gg/heroes/sun-bin/"},{"slug":"sun-ce","name":"Sun Ce","tier":"B","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/sun-ce.jpg","url":"https://hokstats.gg/heroes/sun-ce/"},{"slug":"ukyo-tachibana","name":"Ukyo Tachibana","tier":"C","roles":["Jungle","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/ukyo-tachibana.jpg","url":"https://hokstats.gg/heroes/ukyo-tachibana/"},{"slug":"umbrosa","name":"Umbrosa","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/umbrosa.jpg","url":"https://hokstats.gg/heroes/umbrosa/"},{"slug":"wang-zhaojun","name":"Wang Zhaojun","tier":"S","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/wang-zhaojun.jpg","url":"https://hokstats.gg/heroes/wang-zhaojun/"},{"slug":"wukong","name":"Wukong","tier":"A","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/wukong.jpg","url":"https://hokstats.gg/heroes/wukong/"},{"slug":"wuyan","name":"Wuyan","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/wuyan.jpg","url":"https://hokstats.gg/heroes/wuyan/"},{"slug":"xiang-yu","name":"Xiang Yu","tier":"B","roles":["Roam","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/xiang-yu.jpg","url":"https://hokstats.gg/heroes/xiang-yu/"},{"slug":"xiao-qiao","name":"Xiao Qiao","tier":"A","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/xiao-qiao.jpg","url":"https://hokstats.gg/heroes/xiao-qiao/"},{"slug":"xuance","name":"Xuance","tier":"C","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/xuance.jpg","url":"https://hokstats.gg/heroes/xuance/"},{"slug":"yang-jian","name":"Yang Jian","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yang-jian.jpg","url":"https://hokstats.gg/heroes/yang-jian/"},{"slug":"yango","name":"Yango","tier":"C","roles":["Clash Lane","Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yango.jpg","url":"https://hokstats.gg/heroes/yango/"},{"slug":"yao","name":"Yao","tier":"C","roles":["Jungle","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yao.jpg","url":"https://hokstats.gg/heroes/yao/"},{"slug":"yaria","name":"Yaria","tier":"A","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yaria.jpg","url":"https://hokstats.gg/heroes/yaria/"},{"slug":"ying","name":"Ying","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/ying.jpg","url":"https://hokstats.gg/heroes/ying/"},{"slug":"yixing","name":"Yixing","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yixing.jpg","url":"https://hokstats.gg/heroes/yixing/"},{"slug":"yuhuan","name":"Yuhuan","tier":"C","roles":["Mid","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/yuhuan.jpg","url":"https://hokstats.gg/heroes/yuhuan/"},{"slug":"zhang-fei","name":"Zhang Fei","tier":"B","roles":["Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/zhang-fei.jpg","url":"https://hokstats.gg/heroes/zhang-fei/"},{"slug":"zhou-yu","name":"Zhou Yu","tier":"C","roles":["Mid"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/zhou-yu.jpg","url":"https://hokstats.gg/heroes/zhou-yu/"},{"slug":"zhuangzi","name":"Zhuangzi","tier":"B","roles":["Roam","Clash Lane"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/zhuangzi.jpg","url":"https://hokstats.gg/heroes/zhuangzi/"},{"slug":"zilong","name":"Zilong","tier":"B","roles":["Jungle"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/zilong.jpg","url":"https://hokstats.gg/heroes/zilong/"},{"slug":"ziya","name":"Ziya","tier":"B","roles":["Mid","Roam"],"intl_exclusive":false,"image":"https://hokstats.gg/heroes-splash/ziya.jpg","url":"https://hokstats.gg/heroes/ziya/"}];

const ROLES = ["Clash Lane", "Jungle", "Mid", "Farm", "Roam"];
const ROLE_COLOR = { "Clash Lane": "#c0392b", "Jungle": "#2e8b3d", "Mid": "#7c4dff", "Farm": "#d4a017", "Roam": "#1f8a9c" };
const TIER_STYLE = {
  S: { color: "#f5c451", glow: "rgba(245,196,81,0.35)", chevrons: 3 },
  A: { color: "#e0703a", glow: "rgba(224,112,58,0.30)", chevrons: 2 },
  B: { color: "#5aa9e6", glow: "rgba(90,169,230,0.28)", chevrons: 1 },
  C: { color: "#8a94a6", glow: "rgba(138,148,166,0.22)", chevrons: 0 },
};
const COMFORT_COLOR = "#e879f9";
const SUPER_COMFORT_COLOR = "#ff2d95";
const TIER_ORDER = { S: 0, A: 1, B: 2, C: 3, D: 4 };
const TIERS = ["S", "A", "B", "C"];
function heroBySlug(slug) { return HEROES.find((h) => h.slug === slug) || null; }
function sortByTier(list) {
  return [...list].sort((a, b) => {
    const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    return t !== 0 ? t : a.name.localeCompare(b.name);
  });
}

// ---- Rank Draft state machine ----
const BAN_ORDER = ["A", "B", "A", "B", "A", "B"];
const PICK_ORDER = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B"];
const TOTAL_BANS = BAN_ORDER.length;
const TOTAL_PICKS = PICK_ORDER.length;
const TOTAL_STEPS = TOTAL_BANS + TOTAL_PICKS;

function getStep(stepIndex) {
  if (stepIndex < TOTAL_BANS) return { phase: "ban", team: BAN_ORDER[stepIndex], index: stepIndex };
  if (stepIndex < TOTAL_STEPS) {
    const pickIndex = stepIndex - TOTAL_BANS;
    return { phase: "pick", team: PICK_ORDER[pickIndex], index: pickIndex };
  }
  return { phase: "complete", team: null, index: -1 };
}
function initialDraftState() {
  return { step: 0, bans: { A: [], B: [] }, picks: { A: [], B: [] } };
}
function applyAction(state, heroSlug) {
  const step = getStep(state.step);
  if (step.phase === "complete") return state;
  const next = {
    step: state.step + 1,
    bans: { A: [...state.bans.A], B: [...state.bans.B] },
    picks: { A: [...state.picks.A], B: [...state.picks.B] },
  };
  if (step.phase === "ban") next.bans[step.team].push(heroSlug);
  else next.picks[step.team].push(heroSlug);
  return next;
}
function isHeroTaken(state, slug) {
  return state.bans.A.includes(slug) || state.bans.B.includes(slug) || state.picks.A.includes(slug) || state.picks.B.includes(slug);
}

// ---- UI bits ----
function Chevrons({ tier }) {
  const t = TIER_STYLE[tier] || TIER_STYLE.C;
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 10, clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          background: i < t.chevrons ? t.color : "rgba(255,255,255,0.12)",
          boxShadow: i < t.chevrons ? `0 0 6px ${t.glow}` : "none",
        }} />
      ))}
    </div>
  );
}

// comfortLevel: null | "comfort" | "super"
function TierOrComfortBadge({ tier, comfortLevel }) {
  if (comfortLevel) {
    const isSuper = comfortLevel === "super";
    const color = isSuper ? SUPER_COMFORT_COLOR : COMFORT_COLOR;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 3, filter: isSuper ? `drop-shadow(0 0 4px ${color}99)` : "none" }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, color }}>{isSuper ? "XX" : "X"}</span>
        <Heart size={10} color={color} fill={isSuper ? color : "none"} strokeWidth={2} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, color: (TIER_STYLE[tier]||TIER_STYLE.C).color }}>{tier}</span>
      <Chevrons tier={tier} />
    </div>
  );
}

function HeroCard({ hero, status, onClick, disabled, comfortLevel }) {
  const t = TIER_STYLE[hero.tier] || TIER_STYLE.C;
  const isTaken = status === "banned" || status === "picked";
  const accentColor = comfortLevel === "super" ? SUPER_COMFORT_COLOR : comfortLevel === "comfort" ? COMFORT_COLOR : t.color;
  return (
    <button
      onClick={() => !isTaken && !disabled && onClick?.(hero)}
      disabled={isTaken || disabled}
      style={{
        position: "relative", display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", width: "100%",
        background: "#1a1e26", border: `1px solid ${comfortLevel ? accentColor + "40" : "rgba(255,255,255,0.06)"}`, textAlign: "left", padding: 0,
        cursor: isTaken || disabled ? "default" : "pointer", opacity: isTaken ? 0.32 : 1, transition: "transform .15s, border-color .15s",
      }}
      onMouseEnter={(e) => { if (isTaken || disabled) return; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = accentColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = comfortLevel ? accentColor + "40" : "rgba(255,255,255,0.06)"; }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#0f1115", overflow: "hidden" }}>
        <img src={hero.image} alt={hero.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, boxSizing: "border-box", display: "block" }} onError={(e) => { e.currentTarget.style.opacity = 0.1; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,17,21,0) 55%, rgba(15,17,21,0.92) 100%)" }} />
        {status === "banned" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}><Ban size={26} color="#ef4444" strokeWidth={2.5} /></div>}
        {status === "picked" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}><Lock size={22} color="#8a94a6" strokeWidth={2.5} /></div>}
        <div style={{ position: "absolute", top: 5, left: 5, display: "flex", alignItems: "center", gap: 4, background: "rgba(10,11,14,0.72)", borderRadius: 5, padding: "2px 5px", border: `1px solid ${accentColor}55` }}>
          <TierOrComfortBadge tier={hero.tier} comfortLevel={comfortLevel} />
        </div>
        {hero.intl_exclusive && <div style={{ position: "absolute", top: 5, right: 5, fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, color: "#0f1115", background: "#e8e2d6", borderRadius: 4, padding: "1.5px 4px" }}>INTL</div>}
        <div style={{ position: "absolute", bottom: 5, left: 6, right: 6 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: "#f2efe9", lineHeight: 1.15, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{hero.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
            {hero.roles.map((r) => <span key={r} style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, fontWeight: 600, color: "#0f1115", background: ROLE_COLOR[r], borderRadius: 3, padding: "1px 4px" }}>{r}</span>)}
          </div>
        </div>
      </div>
    </button>
  );
}

function HeroGrid({ getStatus, onSelect, disabled, getComfortLevel }) {
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState("All");
  const [activeTier, setActiveTier] = useState("All");
  const filtered = useMemo(() => {
    let list = HEROES;
    if (activeRole !== "All") list = list.filter((h) => h.roles.includes(activeRole));
    if (activeTier !== "All") list = list.filter((h) => h.tier === activeTier);
    if (query.trim()) { const q = query.trim().toLowerCase(); list = list.filter((h) => h.name.toLowerCase().includes(q)); }
    return sortByTier(list);
  }, [query, activeRole, activeTier]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...ROLES].map((r) => {
            const isActive = activeRole === r;
            return (
              <button key={r} onClick={() => setActiveRole(r)} style={{
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${isActive ? "#f5c451" : "rgba(255,255,255,0.1)"}`, background: isActive ? "#f5c45122" : "transparent", color: isActive ? "#f5c451" : "#8a94a6",
              }}>{r}</button>
            );
          })}
        </div>
        <div style={{ position: "relative", width: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hero..." style={{
            width: "100%", background: "#1a1e26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "7px 28px 7px 30px", color: "#e8e6e1", fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box",
          }} />
          {query && <X size={14} onClick={() => setQuery("")} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "#6b7280", cursor: "pointer" }} />}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: 0.5, color: "#6b7280", marginRight: 2 }}>TIER</span>
        {["All", ...TIERS].map((t) => {
          const isActive = activeTier === t;
          const color = t === "All" ? "#e8e6e1" : TIER_STYLE[t].color;
          return (
            <button key={t} onClick={() => setActiveTier(t)} style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`, background: isActive ? `${color}22` : "transparent", color: isActive ? color : "#8a94a6",
            }}>{t}</button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 8 }}>
        {filtered.map((hero) => <HeroCard key={hero.slug} hero={hero} status={getStatus(hero)} onClick={onSelect} disabled={disabled} comfortLevel={getComfortLevel ? getComfortLevel(hero) : null} />)}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "50px 0", color: "#6b7280", fontFamily: "'Rajdhani',sans-serif" }}>No heroes match your filters.</div>}
    </div>
  );
}

function BanSlot({ slug }) {
  const hero = slug ? heroBySlug(slug) : null;
  return (
    <div style={{ position: "relative", width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#0f1115", border: "1px solid rgba(239,68,68,0.35)" }}>
      {hero && (<><img src={hero.image} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "grayscale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ban size={14} color="#ef4444" strokeWidth={2.5} /></div></>)}
    </div>
  );
}

function PickSlot({ slug, side, active }) {
  const hero = slug ? heroBySlug(slug) : null;
  const accent = side === "A" ? "#3b82f6" : "#ef4444";
  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "3/4", background: "#0f1115", border: `1.5px solid ${hero ? accent + "88" : active ? accent : "rgba(255,255,255,0.08)"}`, boxShadow: active ? `0 0 14px ${accent}55` : "none" }}>
      {hero ? (
        <>
          <img src={hero.image} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,17,21,0) 55%, rgba(15,17,21,0.95) 100%)" }} />
          <div style={{ position: "absolute", bottom: 4, left: 5, right: 5 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, color: "#f2efe9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hero.name}</div>
          </div>
        </>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {active && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 600, color: accent }}>PICKING</span>}
        </div>
      )}
    </div>
  );
}

function TeamPanel({ side, name, bans, picks, activeStep }) {
  const accent = side === "A" ? "#3b82f6" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: side === "B" ? "row-reverse" : "row" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: accent }} />
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 17, color: accent }}>{name}</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexDirection: side === "B" ? "row-reverse" : "row" }}>
        {Array.from({ length: 3 }).map((_, i) => <BanSlot key={i} slug={bans[i]} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, direction: side === "B" ? "rtl" : "ltr" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <PickSlot key={i} slug={picks[i]} side={side} active={activeStep.phase === "pick" && activeStep.team === side && activeStep.index === i} />
        ))}
      </div>
    </div>
  );
}

function TurnIndicator({ step }) {
  if (step.phase === "complete") return <div style={{ textAlign: "center", padding: "8px 0" }}><span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 20, color: "#f5c451" }}>DRAFT COMPLETE</span></div>;
  const accent = step.team === "A" ? "#3b82f6" : "#ef4444";
  const label = step.phase === "ban" ? "BAN PHASE" : "PICK PHASE";
  const progress = step.phase === "ban" ? `${step.index + 1} / ${TOTAL_BANS}` : `${step.index + 1} / ${TOTAL_PICKS}`;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 0" }}>
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, padding: "4px 10px", borderRadius: 5, color: step.phase === "ban" ? "#ef4444" : "#f5c451", border: `1px solid ${step.phase === "ban" ? "#ef4444" : "#f5c451"}55` }}>{label}</span>
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 15, color: accent }}>Team {step.team}'s turn</span>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#6b7280" }}>{progress}</span>
    </div>
  );
}

function AlgorithmToggle({ mode, setMode }) {
  const isComfort = mode === "comfort";
  return (
    <button onClick={() => setMode(isComfort ? "standard" : "comfort")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}
      title="Switches how the AI recommendation engine will weigh suggestions (standard meta tier vs. leaning on your comfort picks)">
      <Sparkles size={14} color={isComfort ? COMFORT_COLOR : "#8a94a6"} />
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: 1, color: "#8a94a6" }}>ALGORITHM</span>
      <div style={{ position: "relative", width: 40, height: 20, borderRadius: 999, background: isComfort ? COMFORT_COLOR : "rgba(255,255,255,0.15)", transition: "background .15s" }}>
        <div style={{ position: "absolute", width: 16, height: 16, top: 2, left: 2, borderRadius: "50%", background: "#fff", transform: isComfort ? "translateX(20px)" : "translateX(0)", transition: "transform .15s" }} />
      </div>
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 12, color: isComfort ? COMFORT_COLOR : "#e8e6e1" }}>
        {isComfort ? "COMFORT-WEIGHTED" : "STANDARD"}
      </span>
    </button>
  );
}

// ---- Comfort Picks screen ----
function DraggablePoolCard({ hero }) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", hero.slug); e.dataTransfer.effectAllowed = "copy"; }}
      style={{ width: 108, flexShrink: 0, cursor: "grab" }}
    >
      <HeroCard hero={hero} status="available" />
    </div>
  );
}

function LevelZone({ lane, level, assignedSlugs, onDrop, onRemove }) {
  const [isOver, setIsOver] = useState(false);
  const isSuper = level === "super";
  const accent = isSuper ? SUPER_COMFORT_COLOR : COMFORT_COLOR;
  const heroes = [...assignedSlugs].map((slug) => heroBySlug(slug)).filter(Boolean);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); const slug = e.dataTransfer.getData("text/plain"); if (slug) onDrop(lane, level, slug); }}
      style={{
        display: "flex", flexDirection: "column", borderRadius: 6, minHeight: 84,
        border: `1.5px dashed ${isOver ? accent : accent + "35"}`, background: isOver ? `${accent}18` : "transparent", transition: "background .1s, border-color .1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 4px" }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: accent }}>{isSuper ? "SUPER COMFORT" : "COMFORT"}</span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>{heroes.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 6px 6px", flex: 1 }}>
        {heroes.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#4a4f58" }}>Drop here</span>
          </div>
        )}
        {heroes.map((hero) => {
          const offRole = !hero.roles.includes(lane);
          return (
            <div key={hero.slug} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 5, padding: "4px 6px", background: "#1a1e26", border: `1px solid ${accent}33` }}>
              <div style={{ position: "relative", width: 20, height: 24, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#0f1115" }}>
                <img src={hero.image} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 11, flex: 1, color: "#e8e6e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hero.name}</span>
              {offRole && (
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 7.5, fontWeight: 700, borderRadius: 3, padding: "1px 3px", color: "#12141a", background: accent, flexShrink: 0 }} title={`Off-role: ${hero.name}'s listed lane(s) are ${hero.roles.join(", ")}`}>
                  OFF
                </span>
              )}
              <button onClick={() => onRemove(lane, level, hero.slug)} style={{ flexShrink: 0, background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LaneColumn({ lane, assignments, onDrop, onRemove }) {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: ROLE_COLOR[lane] }} />
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, color: ROLE_COLOR[lane] }}>{lane.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
        <LevelZone lane={lane} level="super" assignedSlugs={assignments.super} onDrop={onDrop} onRemove={onRemove} />
        <LevelZone lane={lane} level="comfort" assignedSlugs={assignments.comfort} onDrop={onDrop} onRemove={onRemove} />
      </div>
    </div>
  );
}

function ComfortPicksScreen({ comfortAssignments, assignComfort, removeComfort, totalAssignments, onDone }) {
  const pool = sortByTier(HEROES);
  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "20px 18px 16px", background: "#12141a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={onDone} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: "#8a94a6" }}><ArrowLeft size={14} /> Back</button>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 20, color: "#f2efe9", margin: 0 }}>COMFORT HEROES</h1>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#6b7280", margin: 0 }}>Drag into Super Comfort or Comfort, any lane — {totalAssignments} assigned</p>
            </div>
            <button onClick={onDone} style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, borderRadius: 6, padding: "8px 20px", background: COMFORT_COLOR, color: "#12141a", border: "none", cursor: "pointer" }}>Done</button>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {pool.map((hero) => <DraggablePoolCard key={hero.slug} hero={hero} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 18px 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ROLES.length}, 1fr)`, gap: 10 }}>
          {ROLES.map((lane) => (
            <LaneColumn key={lane} lane={lane} assignments={comfortAssignments[lane]} onDrop={assignComfort} onRemove={removeComfort} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RankDraftBoard({ onBack, onOpenComfort, isComfortHero, totalAssignments, algorithmMode, setAlgorithmMode }) {
  const [state, setState] = useState(initialDraftState());
  const [history, setHistory] = useState([]);
  const step = getStep(state.step);

  function handleSelect(hero) {
    if (step.phase === "complete" || isHeroTaken(state, hero.slug)) return;
    setHistory((h) => [...h, state]);
    setState((s) => applyAction(s, hero.slug));
  }
  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }
  function handleReset() {
    setState(initialDraftState());
    setHistory([]);
  }
  function getStatus(hero) {
    if (state.bans.A.includes(hero.slug) || state.bans.B.includes(hero.slug)) return "banned";
    if (state.picks.A.includes(hero.slug) || state.picks.B.includes(hero.slug)) return "picked";
    return "available";
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 50px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: "#8a94a6" }}><ArrowLeft size={14} /> Mode select</button>
        <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 24, color: "#f2efe9", margin: 0 }}>RANK DRAFT</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              cursor: history.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 600, fontSize: 13, color: history.length === 0 ? "#4a4f58" : "#e8e6e1",
            }}
          >
            <Undo2 size={13} /> Undo
          </button>
          <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: "#8a94a6" }}><RotateCcw size={13} /> Reset</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16, borderRadius: 8, padding: "10px 16px", background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
        <AlgorithmToggle mode={algorithmMode} setMode={setAlgorithmMode} />
        <button onClick={onOpenComfort} style={{
          display: "flex", alignItems: "center", gap: 6, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
          borderRadius: 6, padding: "6px 14px", background: `${COMFORT_COLOR}20`, color: COMFORT_COLOR, border: `1px solid ${COMFORT_COLOR}55`, cursor: "pointer",
        }}>
          <Heart size={13} fill={COMFORT_COLOR} /> Comfort Heroes ({totalAssignments})
        </button>
      </div>

      <TurnIndicator step={step} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, marginBottom: 20, alignItems: "start" }}>
        <TeamPanel side="A" name="TEAM A" bans={state.bans.A} picks={state.picks.A} activeStep={step} />
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.08)" }} />
        <TeamPanel side="B" name="TEAM B" bans={state.bans.B} picks={state.picks.B} activeStep={step} />
      </div>

      <div style={{ borderRadius: 10, padding: 14, background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
        <HeroGrid getStatus={getStatus} onSelect={handleSelect} disabled={step.phase === "complete"} getComfortLevel={isComfortHero} />
      </div>
    </div>
  );
}

function ModeCard({ icon, title, phases, disabled, onClick }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      position: "relative", display: "flex", flexDirection: "column", gap: 14, borderRadius: 12, padding: 26,
      background: "#1a1e26", border: "1px solid rgba(255,255,255,0.08)", opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer",
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,196,81,0.1)", color: "#f5c451" }}>{icon}</div>
      <div>
        <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 22, color: "#f2efe9", margin: 0 }}>{title}</h2>
        {disabled && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#6b7280" }}>COMING SOON</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8a94a6", fontFamily: "'Inter',sans-serif" }}>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: "#8a94a6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("menu");
  const [comfortAssignments, setComfortAssignments] = useState(() => {
    const obj = {};
    ROLES.forEach((lane) => (obj[lane] = { super: new Set(), comfort: new Set() }));
    return obj;
  });
  const [algorithmMode, setAlgorithmMode] = useState("standard");

  function assignComfort(lane, level, slug) {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: { super: new Set(prev[lane].super), comfort: new Set(prev[lane].comfort) } };
      next[lane].super.delete(slug);
      next[lane].comfort.delete(slug);
      next[lane][level].add(slug);
      return next;
    });
  }
  function removeComfort(lane, level, slug) {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: { super: new Set(prev[lane].super), comfort: new Set(prev[lane].comfort) } };
      next[lane][level].delete(slug);
      return next;
    });
  }
  const totalAssignments = ROLES.reduce((sum, lane) => sum + comfortAssignments[lane].super.size + comfortAssignments[lane].comfort.size, 0);
  function isComfortHero(hero) {
    const anySuper = ROLES.some((lane) => comfortAssignments[lane].super.has(hero.slug));
    if (anySuper) return "super";
    const anyComfort = ROLES.some((lane) => comfortAssignments[lane].comfort.has(hero.slug));
    return anyComfort ? "comfort" : null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#12141a", color: "#e8e6e1", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {view === "menu" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 4, color: "#6b7280", marginBottom: 6 }}>HONOR OF KINGS · INTERNATIONAL SERVER</div>
            <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 34, color: "#f2efe9", margin: 0 }}>DRAFT PICK</h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#6b7280", marginTop: 6 }}>Choose a draft format to begin</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 680, width: "100%" }}>
            <ModeCard icon={<Swords size={20} />} title="RANK DRAFT" phases={["Phase 1 — 3 bans per side (6 total)", "Phase 2 — 5 picks per team"]} onClick={() => setView("rank")} />
            <ModeCard icon={<Trophy size={20} />} title="TOURNAMENT DRAFT" phases={["Phase 1 — 2 bans, 3 picks", "Phase 2 — 2 bans, 2 picks"]} disabled />
          </div>
        </div>
      )}

      {view === "rank" && (
        <RankDraftBoard
          onBack={() => setView("menu")}
          onOpenComfort={() => setView("comfort")}
          isComfortHero={isComfortHero}
          totalAssignments={totalAssignments}
          algorithmMode={algorithmMode}
          setAlgorithmMode={setAlgorithmMode}
        />
      )}

      {view === "comfort" && (
        <ComfortPicksScreen
          comfortAssignments={comfortAssignments}
          assignComfort={assignComfort}
          removeComfort={removeComfort}
          totalAssignments={totalAssignments}
          onDone={() => setView("rank")}
        />
      )}
    </div>
  );
}
